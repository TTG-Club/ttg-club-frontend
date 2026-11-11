import type { ChildNode } from 'domhandler';

import type { BookLink, GodLink, ScreenLink } from './schema';
import type {
  ScreenGroup,
  ScreenWindowPoint,
  ScreenWindowSize,
  SvgNode,
} from './types';

import { capitalize, groupBy, sortBy } from 'es-toolkit';
import { parseDocument } from 'htmlparser2';

import {
  SCREEN_WINDOW_CASCADE_LENGTH,
  SCREEN_WINDOW_CASCADE_STEP,
  SCREEN_WINDOW_CLICK_OFFSET,
  SCREEN_WINDOW_HEADER_HEIGHT,
  SCREEN_WINDOW_LEFT_INSET,
  SCREEN_WINDOW_MARGIN,
  SCREEN_WINDOW_MIN_SIZE,
  SCREEN_WINDOW_SIZE,
  SCREEN_WINDOW_VISIBLE_PART,
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

/**
 * Ограничивает число отрезком; если отрезок пуст, отдаёт его начало.
 * @param value - число
 * @param min - начало отрезка
 * @param max - конец отрезка
 */
function clampToRange(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

/**
 * Размер нового окна ширмы: обычный, но не больше экрана за вычетом
 * боковой панели и отступов.
 * @param viewport - размер экрана
 */
export function fitScreenWindowSize(
  viewport: ScreenWindowSize,
): ScreenWindowSize {
  const availableWidth =
    viewport.width - SCREEN_WINDOW_LEFT_INSET - SCREEN_WINDOW_MARGIN * 2;

  const availableHeight = viewport.height - SCREEN_WINDOW_MARGIN * 2;

  return {
    width: Math.max(
      SCREEN_WINDOW_MIN_SIZE.width,
      Math.min(SCREEN_WINDOW_SIZE.width, availableWidth),
    ),
    height: Math.max(
      SCREEN_WINDOW_MIN_SIZE.height,
      Math.min(SCREEN_WINDOW_SIZE.height, availableHeight),
    ),
  };
}

/**
 * Место нового окна ширмы: рядом с точкой клика, а без неё — лесенкой от
 * центра экрана. Окно целиком на экране и не встаёт под боковую панель.
 * @param viewport - размер экрана
 * @param size - размер окна
 * @param origin - точка клика
 * @param index - сколько окон уже открыто
 */
export function placeScreenWindow(
  viewport: ScreenWindowSize,
  size: ScreenWindowSize,
  origin: ScreenWindowPoint | undefined,
  index: number,
): ScreenWindowPoint {
  const cascade =
    (index % SCREEN_WINDOW_CASCADE_LENGTH) * SCREEN_WINDOW_CASCADE_STEP;

  const preferred = origin
    ? {
        x: origin.x + SCREEN_WINDOW_CLICK_OFFSET,
        y: origin.y + SCREEN_WINDOW_CLICK_OFFSET,
      }
    : {
        x: (viewport.width - size.width) / 2 + cascade,
        y: (viewport.height - size.height) / 2 + cascade,
      };

  return {
    x: Math.round(
      clampToRange(
        preferred.x,
        SCREEN_WINDOW_LEFT_INSET + SCREEN_WINDOW_MARGIN,
        viewport.width - size.width - SCREEN_WINDOW_MARGIN,
      ),
    ),
    y: Math.round(
      clampToRange(
        preferred.y,
        SCREEN_WINDOW_MARGIN,
        viewport.height - size.height - SCREEN_WINDOW_MARGIN,
      ),
    ),
  };
}

/**
 * Место окна, за которое его можно ухватить: окно может уйти за край
 * экрана, но шапка остаётся видна, а с боков виден кусок окна.
 * @param position - желаемое место
 * @param size - размер окна
 * @param viewport - размер экрана
 */
export function keepScreenWindowReachable(
  position: ScreenWindowPoint,
  size: ScreenWindowSize,
  viewport: ScreenWindowSize,
): ScreenWindowPoint {
  return {
    x: Math.round(
      clampToRange(
        position.x,
        SCREEN_WINDOW_LEFT_INSET + SCREEN_WINDOW_VISIBLE_PART - size.width,
        viewport.width - SCREEN_WINDOW_VISIBLE_PART,
      ),
    ),
    y: Math.round(
      clampToRange(
        position.y,
        0,
        viewport.height - SCREEN_WINDOW_HEADER_HEIGHT,
      ),
    ),
  };
}
