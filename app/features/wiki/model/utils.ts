import type { ChildNode } from 'domhandler';

import type { BookLink, GodLink, ScreenLink } from './schema';
import type { ScreenGroup, SvgNode } from './types';

import { capitalize, groupBy, sortBy } from 'es-toolkit';
import { parseDocument } from 'htmlparser2';

import {
  SVG_ALLOWED_ATTRIBUTES,
  SVG_ALLOWED_TAGS,
  SVG_CURRENT_COLOR,
  SVG_NO_PAINT,
  WIKI_LIST_SEPARATOR,
} from './constants';

/**
 * Группа бога в списке — его мировоззрение, как в старом SPA.
 * @param god - бог из списка
 */
export function getGodGroup(god: GodLink): string {
  return capitalize(god.alignment);
}

/**
 * Группа источника в списке — тип книги.
 * @param book - источник из списка
 */
export function getBookGroup(book: BookLink): string {
  return book.type.name;
}

/**
 * Порядок группы книги: ручка отдаёт книги по году, а группы идут по
 * порядку типа, как в старом SPA.
 * @param book - книга из списка
 */
export function getBookOrder(book: BookLink): number {
  return book.type.order;
}

/**
 * Собирает значения свойства в строку; пустой список — пустая строка.
 * @param values - значения свойства
 */
export function joinWikiList(values?: Array<string> | null): string {
  return values?.join(WIKI_LIST_SEPARATOR) ?? '';
}

/**
 * Разделы по порядку, затем по названию.
 * @param screens - разделы ширмы
 */
function sortScreens(screens: Array<ScreenLink>): Array<ScreenLink> {
  return sortBy(screens, [
    (screen) => screen.order ?? 0,
    (screen) => screen.name.rus,
  ]);
}

/**
 * Группы вложенных разделов, как в старом SPA: сначала разделы вне групп,
 * затем группы по названию.
 * @param screens - вложенные разделы
 */
export function groupScreens(screens: Array<ScreenLink>): Array<ScreenGroup> {
  const ungrouped = screens.filter((screen) => !screen.group);

  const grouped = groupBy(
    screens.filter((screen) => screen.group),
    (screen) => screen.group ?? '',
  );

  const names = Object.keys(grouped).sort((first, second) =>
    first.localeCompare(second),
  );

  const groups: Array<ScreenGroup> = names.map((name) => ({
    key: name,
    name,
    items: sortScreens(grouped[name] ?? []),
  }));

  return ungrouped.length
    ? [{ key: '', items: sortScreens(ungrouped) }, ...groups]
    : groups;
}

/**
 * Атрибуты SVG без ссылок, стилей и событий; цвет заливки и обводки
 * берётся из текста.
 * @param attributes - атрибуты из разметки
 */
function sanitizeSvgAttributes(
  attributes: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(attributes)
      .filter(([name]) => SVG_ALLOWED_ATTRIBUTES.has(name))
      .map(([name, value]) =>
        (name === 'fill' || name === 'stroke') && value !== SVG_NO_PAINT
          ? [name, SVG_CURRENT_COLOR]
          : [name, value],
      ),
  );
}

/**
 * Узел SVG из разметки; неразрешённые теги отбрасываются вместе с
 * содержимым.
 * @param node - узел разметки
 */
function toSvgNode(node: ChildNode): SvgNode | undefined {
  if (node.type !== 'tag' || !SVG_ALLOWED_TAGS.has(node.name)) {
    return undefined;
  }

  return {
    tag: node.name,
    attributes: sanitizeSvgAttributes(node.attribs),
    children: node.children.flatMap((child) => toSvgNode(child) ?? []),
  };
}

/**
 * Иконка раздела ширмы из SVG-разметки базы: только геометрия, без
 * скриптов и ссылок. Без корневого `svg` иконки нет.
 * @param markup - SVG-разметка
 */
export function parseSvgIcon(markup: string): SvgNode | undefined {
  const root = parseDocument(markup, { xmlMode: true }).children.find(
    (node) => node.type === 'tag',
  );

  const icon = root ? toSvgNode(root) : undefined;

  if (icon?.tag !== 'svg') {
    return undefined;
  }

  return {
    ...icon,
    attributes: {
      ...icon.attributes,
      fill: icon.attributes.fill ?? SVG_CURRENT_COLOR,
      width: '100%',
      height: '100%',
    },
  };
}
