import type { MarkerNode, RenderNode } from '~news/markup';

import { z } from 'zod';

import {
  clampHeadingLevel,
  serializeInlineNodes,
  serializeMarkup,
} from '~news/markup';

import { LSS_SITE_LINK_PATTERN } from './constants';

/**
 * Перевод текстов LSS (документы редактора TipTap) в разметку листа: массив
 * блоков-строк, как её хранит лист. Незнакомые узлы разбираются по
 * содержимому — потерять текст хуже, чем потерять оформление.
 */

/** Блок или строчный узел разметки до сериализации. */
type MarkupNode = string | MarkerNode;

/** Узел документа TipTap. */
interface TiptapNode {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  content?: Array<TiptapNode>;
}

const tiptapMarkSchema = z.object({
  type: z.string().catch(''),
  attrs: z.record(z.string(), z.unknown()).optional().catch(undefined),
});

const tiptapNodeSchema: z.ZodType<TiptapNode> = z.lazy(() =>
  z.object({
    type: z.string().catch(''),
    text: z.string().optional().catch(undefined),
    attrs: z.record(z.string(), z.unknown()).optional().catch(undefined),
    marks: z.array(tiptapMarkSchema).optional().catch(undefined),
    content: z.array(tiptapNodeSchema).optional().catch(undefined),
  }),
);

const tiptapDocumentSchema = z
  .object({ content: z.array(tiptapNodeSchema).catch([]) })
  .catch({ content: [] });

/** Отметки TipTap → маркеры разметки. */
const MARK_TYPES: Readonly<Record<string, MarkerNode['type']>> = {
  bold: 'bold',
  italic: 'italic',
  underline: 'underline',
  strike: 'strikethrough',
  highlight: 'highlight',
  superscript: 'superscript',
  subscript: 'subscript',
};

const LIST_TYPES: ReadonlyArray<string> = ['bulletList', 'orderedList'];

/**
 * Адрес ссылки: ссылки на сайты TTG становятся внутренними путями.
 * @param href - адрес из документа
 */
function toLinkUrl(href: unknown): string {
  if (typeof href !== 'string' || !href.trim()) {
    return '';
  }

  return LSS_SITE_LINK_PATTERN.exec(href.trim())?.[1] ?? href.trim();
}

/**
 * Текст с отметками: каждая отметка оборачивает предыдущий результат.
 * @param node - текстовый узел
 */
function toMarkedText(node: TiptapNode): MarkupNode {
  let result: MarkupNode = node.text ?? '';

  for (const mark of node.marks ?? []) {
    if (mark.type === 'link') {
      const url = toLinkUrl(mark.attrs?.href);

      result = url
        ? { type: 'link', attrs: { url }, content: [result] }
        : result;

      continue;
    }

    const markerType = MARK_TYPES[mark.type];

    if (markerType) {
      result = { type: markerType, content: [result] };
    }
  }

  return result;
}

/**
 * Строчные узлы абзаца.
 * @param nodes - узлы абзаца
 */
function toInlineNodes(nodes: ReadonlyArray<TiptapNode>): Array<MarkupNode> {
  const result: Array<MarkupNode> = [];

  for (const node of nodes) {
    if (node.type === 'text') {
      result.push(toMarkedText(node));
    } else if (node.type === 'hardBreak') {
      result.push({ type: 'break' });
    } else if (node.content?.length) {
      result.push(...toInlineNodes(node.content));
    }
  }

  return result;
}

/**
 * Список с вложенными списками.
 * @param node - узел списка
 */
function toListNode(node: TiptapNode): MarkerNode {
  const content: Array<RenderNode> = [];

  for (const item of node.content ?? []) {
    if (LIST_TYPES.includes(item.type)) {
      content.push(toListNode(item));

      continue;
    }

    const inline: Array<MarkupNode> = [];
    const nested: Array<MarkerNode> = [];

    for (const child of item.content ?? []) {
      if (LIST_TYPES.includes(child.type)) {
        nested.push(toListNode(child));

        continue;
      }

      const childInline = toInlineNodes(child.content ?? []);

      if (!childInline.length) {
        continue;
      }

      // Второй абзац пункта — переносом: внутри маркера абзацев нет
      if (inline.length) {
        inline.push({ type: 'break' });
      }

      inline.push(...childInline);
    }

    if (inline.length) {
      content.push({ type: 'li', content: inline });
    }

    content.push(...nested);
  }

  return node.type === 'orderedList'
    ? { type: 'list', attrs: { type: 'ordered' }, content }
    : { type: 'list', content };
}

/**
 * Блоки разметки из узла документа.
 * @param node - узел верхнего уровня
 */
function toBlocks(node: TiptapNode): Array<MarkupNode> {
  if (LIST_TYPES.includes(node.type)) {
    const list = toListNode(node);

    return list.content?.length ? [list] : [];
  }

  if (node.type === 'horizontalRule') {
    return [{ type: 'separator' }];
  }

  if (node.type === 'heading') {
    const content = toInlineNodes(node.content ?? []);

    return content.length
      ? [
          {
            type: 'heading',
            attrs: { level: clampHeadingLevel(node.attrs?.level) },
            content,
          },
        ]
      : [];
  }

  if (node.type === 'blockquote') {
    const paragraphs = (node.content ?? [])
      .map((child) => toInlineNodes(child.content ?? []))
      .filter((paragraph) => paragraph.length);

    return paragraphs.length ? [{ type: 'quote', content: paragraphs }] : [];
  }

  if (node.type === 'paragraph') {
    const text = serializeInlineNodes(toInlineNodes(node.content ?? [])).trim();

    return text ? [text] : [];
  }

  // Счётчики LSS (`resource`) переносятся ресурсами листа, в тексте не нужны
  if (node.type === 'resource' || !node.content?.length) {
    return [];
  }

  return node.content.flatMap(toBlocks);
}

/**
 * Текст листа из документа TipTap: блоки разметки строками.
 * @param doc - документ редактора из файла
 * @param skipLists - пропустить списки (их пункты стали предметами)
 */
export function toMarkupText(doc: unknown, skipLists = false): Array<string> {
  const document = tiptapDocumentSchema.parse(doc);

  return document.content
    .filter((node) => !skipLists || !LIST_TYPES.includes(node.type))
    .flatMap(toBlocks)
    .map((block) => serializeMarkup(block).trim())
    .filter(Boolean);
}

/**
 * Список строкой разметки: пункты как есть.
 * @param items - тексты пунктов
 */
export function toMarkupList(items: ReadonlyArray<string>): string {
  return serializeMarkup({
    type: 'list',
    content: items.map((item) => ({ type: 'li', content: [item] })),
  });
}

/**
 * Простой текст узла со всеми вложенными.
 * @param node - узел документа
 */
function getPlainText(node: TiptapNode): string {
  if (node.type === 'text') {
    return node.text ?? '';
  }

  return (node.content ?? []).map(getPlainText).join('');
}

/**
 * Тексты пунктов списков верхнего уровня: из них собирается снаряжение.
 * @param doc - документ редактора
 */
export function collectListItemTexts(doc: unknown): Array<string> {
  const document = tiptapDocumentSchema.parse(doc);

  return document.content
    .filter((node) => LIST_TYPES.includes(node.type))
    .flatMap((list) => list.content ?? [])
    .map((item) => getPlainText(item).trim())
    .filter(Boolean);
}

/**
 * Ссылки на раздел сайта: название и путь записи (`/items/thieves-tools`).
 * @param doc - документ редактора
 * @param sectionPath - путь раздела, например `/items`
 */
export function collectSectionLinks(
  doc: unknown,
  sectionPath: string,
): Array<{ name: string; url: string }> {
  const document = tiptapDocumentSchema.parse(doc);
  const links: Array<{ name: string; url: string }> = [];
  const prefix = `${sectionPath}/`;

  const walk = (node: TiptapNode): void => {
    const href = node.marks?.find((mark) => mark.type === 'link')?.attrs?.href;
    const linkPath = toLinkUrl(href);

    if (linkPath.startsWith(prefix)) {
      const name = getPlainText(node).trim();

      if (name) {
        links.push({ name, url: linkPath });
      }
    }

    (node.content ?? []).forEach(walk);
  };

  document.content.forEach(walk);

  return links;
}
