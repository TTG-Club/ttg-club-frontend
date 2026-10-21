import type { ChildNode, Element } from 'domhandler';

import type { ContentElementNode, ContentNode } from './types';

import { parseDocument } from 'htmlparser2';

import {
  ALLOWED_ATTRIBUTES,
  ALLOWED_TAGS,
  DETAIL_TOOLTIP_ATTRIBUTES,
  DETAIL_TOOLTIP_TAG,
  DICE_ROLLER_ATTRIBUTES,
  DICE_ROLLER_TAG,
  DROPPED_TAGS,
  QUOTED_LITERAL,
  ROUTER_LINK_TAG,
  SAFE_URL,
  TABLE_STRUCTURE_TAGS,
  URL_ATTRIBUTES,
  VOID_TAGS,
  VUE_BINDING_PREFIXES,
} from './constants';

/**
 * Возвращает имя атрибута без префикса привязки Vue и признак привязки.
 * @param name - имя атрибута из разметки
 */
function splitBinding(name: string): { name: string; isBinding: boolean } {
  const prefix = VUE_BINDING_PREFIXES.find((item) => name.startsWith(item));

  return prefix
    ? { name: name.slice(prefix.length), isBinding: true }
    : { name, isBinding: false };
}

/**
 * Возвращает атрибуты, разрешённые для тега.
 * @param tag - имя тега после очистки
 */
function getAllowedAttributes(tag: string): ReadonlySet<string> {
  if (tag === DICE_ROLLER_TAG) {
    return DICE_ROLLER_ATTRIBUTES;
  }

  if (tag === DETAIL_TOOLTIP_TAG) {
    return DETAIL_TOOLTIP_ATTRIBUTES;
  }

  return ALLOWED_ATTRIBUTES;
}

/**
 * Оставляет только разрешённые атрибуты. Из привязок Vue (`:formula="'2к6'"`)
 * берётся строковый литерал; выражения и обработчики событий отбрасываются,
 * потому что выполнять код из базы нельзя.
 * @param tag - имя тега после очистки
 * @param attributes - атрибуты из разметки
 */
function sanitizeAttributes(
  tag: string,
  attributes: Record<string, string>,
): Record<string, string> {
  const allowed = getAllowedAttributes(tag);
  const result: Record<string, string> = {};

  for (const [rawName, rawValue] of Object.entries(attributes)) {
    const { name, isBinding } = splitBinding(rawName);

    const value = isBinding ? QUOTED_LITERAL.exec(rawValue)?.[1] : rawValue;

    if (value === undefined || !allowed.has(name)) {
      continue;
    }

    if (URL_ATTRIBUTES.has(name) && !SAFE_URL.test(value.trim())) {
      continue;
    }

    result[name] = value;
  }

  return result;
}

/**
 * Приводит `router-link` к обычной ссылке.
 * @param element - элемент из разметки
 */
function normalizeElement(element: Element): {
  tag: string;
  attributes: Record<string, string>;
} {
  if (element.name !== ROUTER_LINK_TAG) {
    return { tag: element.name, attributes: element.attribs };
  }

  const { to, ...rest } = element.attribs;

  return { tag: 'a', attributes: to ? { ...rest, href: to } : rest };
}

/**
 * Собирает строки, лежащие прямо в `table`, в `tbody`: так же поступает
 * браузер, и без этого серверный HTML не совпадёт с клиентским.
 * @param nodes - дочерние узлы таблицы
 */
function wrapTableRows(nodes: Array<ContentNode>): Array<ContentNode> {
  const rows = nodes.filter(
    (node) => node.kind === 'element' && node.tag === 'tr',
  );

  if (!rows.length) {
    return nodes;
  }

  const firstRowIndex = nodes.findIndex((node) => rows.includes(node));
  const rest = nodes.filter((node) => !rows.includes(node));

  const body: ContentElementNode = {
    kind: 'element',
    tag: 'tbody',
    attributes: {},
    children: rows,
  };

  return [...rest.slice(0, firstRowIndex), body, ...rest.slice(firstRowIndex)];
}

/**
 * Очищает дочерние узлы разобранного документа.
 * @param nodes - узлы htmlparser2
 * @param parentTag - тег родителя после очистки
 */
function convertNodes(
  nodes: Array<ChildNode>,
  parentTag?: string,
): Array<ContentNode> {
  const isTextAllowed = !parentTag || !TABLE_STRUCTURE_TAGS.has(parentTag);

  return nodes.flatMap((node): Array<ContentNode> => {
    if (node.type === 'text') {
      return node.data && isTextAllowed
        ? [{ kind: 'text', text: node.data }]
        : [];
    }

    if (node.type !== 'tag') {
      return [];
    }

    const { tag, attributes } = normalizeElement(node);

    if (DROPPED_TAGS.has(tag)) {
      return [];
    }

    const isKnown =
      ALLOWED_TAGS.has(tag)
      || tag === DICE_ROLLER_TAG
      || tag === DETAIL_TOOLTIP_TAG;

    // Незнакомый тег не выводим, но его текст сохраняем.
    if (!isKnown) {
      return convertNodes(node.children, parentTag);
    }

    const children = VOID_TAGS.has(tag) ? [] : convertNodes(node.children, tag);

    const element: ContentElementNode = {
      kind: 'element',
      tag,
      attributes: sanitizeAttributes(tag, attributes),
      children: tag === 'table' ? wrapTableRows(children) : children,
    };

    return [element];
  });
}

/**
 * Разбирает HTML-контент из базы в дерево для рендера без компилятора Vue.
 *
 * Старое SPA компилировало этот HTML как шаблон Vue; здесь он разбирается
 * парсером, а теги `dice-roller` и `detail-tooltip` превращаются в компоненты
 * при рендере. Самозакрывающиеся кастомные теги (`<dice-roller formula="к6"/>`)
 * поддерживаются.
 * @param html - HTML из API
 */
export function parseContent(html: string): Array<ContentNode> {
  const document = parseDocument(html, {
    recognizeSelfClosing: true,
    lowerCaseTags: true,
    lowerCaseAttributeNames: true,
    decodeEntities: true,
  });

  return convertNodes(document.children);
}

/**
 * Возвращает адрес первой ссылки внутри узлов: так старое SPA находило адрес
 * сущности для `detail-tooltip` без атрибута `url`.
 * @param nodes - дочерние узлы подсказки
 */
export function findFirstHref(nodes: Array<ContentNode>): string | undefined {
  for (const node of nodes) {
    if (node.kind !== 'element') {
      continue;
    }

    if (node.tag === 'a' && node.attributes.href) {
      return node.attributes.href;
    }

    const nested = findFirstHref(node.children);

    if (nested) {
      return nested;
    }
  }

  return undefined;
}

/**
 * Проверяет наличие булева атрибута в любом из написаний.
 * @param attributes - атрибуты элемента
 * @param names - допустимые имена атрибута
 */
export function hasAnyAttribute(
  attributes: Record<string, string>,
  names: Array<string>,
): boolean {
  return names.some((name) => name in attributes);
}
