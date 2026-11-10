import type { Component, VNode } from 'vue';

import type { RenderNode } from './types';

import { createTextVNode, h } from 'vue';

import { MARKER_MAP } from './config';
import { parse } from './parser';
import MarkupBadge from './ui/MarkupBadge.vue';
import MarkupHeading from './ui/MarkupHeading.vue';
import MarkupKbd from './ui/MarkupKbd.vue';
import MarkupLink from './ui/MarkupLink.vue';
import MarkupList from './ui/MarkupList.vue';
import MarkupListItem from './ui/MarkupListItem.vue';
import MarkupParagraph from './ui/MarkupParagraph.vue';
import MarkupQuote from './ui/MarkupQuote.vue';
import MarkupRoller from './ui/MarkupRoller.vue';
import MarkupSectionLink from './ui/MarkupSectionLink.vue';
import MarkupSeparator from './ui/MarkupSeparator.vue';
import MarkupTable from './ui/MarkupTable.vue';
import { isBlockNode, isMarkerNode, isSimpleTextNode } from './utils';

/**
 * Компоненты маркеров по типу. Живут отдельно от `config.ts`, чтобы разбор
 * разметки (парсер, текст анонса) не тянул за собой Vue-компоненты.
 */
const MARKER_COMPONENTS: ReadonlyMap<string, Component> = new Map<
  string,
  Component
>([
  ['link', MarkupLink],
  ['kbd', MarkupKbd],
  ['badge', MarkupBadge],
  ['roll', MarkupRoller],
  ['heading', MarkupHeading],
  ['paragraph', MarkupParagraph],
  ['quote', MarkupQuote],
  ['separator', MarkupSeparator],
  ['list', MarkupList],
  ['li', MarkupListItem],
  ['table', MarkupTable],
  ['class', MarkupSectionLink],
  ['species', MarkupSectionLink],
  ['spell', MarkupSectionLink],
  ['feat', MarkupSectionLink],
  ['background', MarkupSectionLink],
  ['magicItem', MarkupSectionLink],
  ['creature', MarkupSectionLink],
  ['item', MarkupSectionLink],
  ['glossary', MarkupSectionLink],
]);

/**
 * Проверяет ПРЯМЫХ детей: блочный маркер не может лежать внутри inline. Глубже НЕ
 * рекурсирует намеренно — каждый узел валидирует своих прямых детей, когда сам
 * рендерится (`renderNode`), поэтому всё дерево проверяется один раз (O(n)), а не
 * O(n×глубина). Массивы-батчи разворачиваем в том же родительском контексте.
 */
function validateContent(
  content: RenderNode[] | undefined,
  parentType: string,
  parentIsBlock: boolean,
): void {
  if (!content) {
    return;
  }

  for (const child of content) {
    // Пропускаем строки и SimpleTextNode
    if (typeof child === 'string' || isSimpleTextNode(child)) {
      continue;
    }

    // Массив-батч разворачиваем в том же контексте (у него нет своего renderNode).
    if (Array.isArray(child)) {
      validateContent(child, parentType, parentIsBlock);

      continue;
    }

    // Блочный маркер внутри inline-элемента — ошибка (глубже проверит renderNode).
    if (isMarkerNode(child) && !parentIsBlock && isBlockNode(child)) {
      throw new Error(
        `[Markup] Block element "${child.type}" cannot be nested inside inline element "${parentType}"`,
      );
    }
  }
}

// Нормализация: всегда возвращает массив VNode
export function renderNodes(nodes: RenderNode[]): VNode[] {
  return nodes.flatMap((node) => {
    const result = renderNode(node);

    return Array.isArray(result) ? result : [result];
  });
}

// Основной рендер - может возвращать VNode или VNode[]
function renderNode(node: RenderNode): VNode | VNode[] {
  // Строка
  if (typeof node === 'string') {
    const parsed = parse(node);

    return renderNodes(parsed);
  }

  // Массив
  if (Array.isArray(node)) {
    return renderNodes(node);
  }

  // Простой текст — рендерим как есть (без Markdown). Форматирование внутри
  // маркеров делается вложенными {@...} (например {@i {@b ...}}), а не Markdown.
  if (isSimpleTextNode(node)) {
    return [createTextVNode(node.text)];
  }

  // Маркер
  if (isMarkerNode(node)) {
    const config = MARKER_MAP.get(node.type);

    if (!config) {
      throw new Error(`[Markup] Unknown node type: ${node.type}`);
    }

    // Валидация контента перед рендером
    const isBlock = config.isBlock === true;

    validateContent(node.content, node.type, isBlock);

    // Empty маркер
    if (config.isEmpty) {
      return h(config.tag!);
    }

    // HTML-тег
    if (config.tag) {
      const children = node.content ? renderNodes(node.content) : [];

      return h(config.tag, children);
    }

    // Vue-компонент
    const component = config.component
      ? MARKER_COMPONENTS.get(node.type)
      : undefined;

    if (component) {
      return h(component, { node, renderNodes });
    }

    throw new Error(`[Markup] No renderer for: ${node.type}`);
  }

  throw new Error('[Markup] Unknown node type');
}

export function render(content: RenderNode | RenderNode[]): VNode[] {
  if (Array.isArray(content)) {
    return renderNodes(content);
  }

  const result = renderNode(content);

  return Array.isArray(result) ? result : [result];
}

/** Группа отрендеренных VNode: блочная (рисуется как есть) или инлайновая (в `<p>`). */
export interface RenderGroup {
  isBlock: boolean;
  /**
   * Тип блочного маркера группы (`separator`, `heading`, …). По нему MarkupRender
   * решает, как отбивать группу от соседей. У инлайновых групп не задан.
   */
  blockType?: string;
  vnodes: VNode[];
}

/** Приводит элемент описания к массиву узлов: строку парсит, массив отдаёт как есть. */
function entryToNodes(entry: RenderNode): RenderNode[] {
  if (typeof entry === 'string') {
    return parse(entry);
  }

  if (Array.isArray(entry)) {
    return entry;
  }

  return [entry];
}

/**
 * Разбивает элемент описания на блочные/инлайновые группы. Строку парсит в узлы,
 * затем разводит их: блочные маркеры (заголовок, список, цитата, разделитель,
 * таблица) идут отдельными БЛОЧНЫМИ группами (без обёртки <p>), а идущие подряд
 * текст/инлайн-маркеры сливаются в одну инлайновую группу.
 *
 * Нужно, чтобы блочный маркер НИКОГДА не оказался внутри <p> — даже если в одной
 * строке-исходнике идут вперемешку `{@h ...}` и обычный текст.
 *
 * @param entry - Элемент описания (строка-исходник, узел или массив узлов)
 */
export function toBlockGroups(entry: RenderNode): RenderGroup[] {
  const nodes = entryToNodes(entry);

  const groups: RenderGroup[] = [];

  let inlineRun: RenderNode[] = [];

  const flushInline = (): void => {
    if (inlineRun.length) {
      groups.push({ isBlock: false, vnodes: renderNodes(inlineRun) });
      inlineRun = [];
    }
  };

  for (const node of nodes) {
    if (isBlockNode(node)) {
      flushInline();

      groups.push({
        isBlock: true,
        // isBlockNode пропускает только маркеры, но сам не сужает тип.
        blockType: isMarkerNode(node) ? node.type : undefined,
        vnodes: render(node),
      });
    } else {
      inlineRun.push(node);
    }
  }

  flushInline();

  return groups;
}
