import type { SectionConfig } from '~section/model';

/* --- Боги --------------------------------------------------------------- */

export const GODS_SECTION: SectionConfig = {
  key: 'gods',
  title: 'Боги',
  path: '/gods',
  listUrl: '/api/v1/gods',
  filterUrl: '/api/v1/filters/gods',
  // Поле в API называется с опечаткой, как и в старом SPA
  order: [
    { field: 'aligment', direction: 'asc' },
    { field: 'name', direction: 'asc' },
  ],
};

/** Подписи свойств бога в карточке */
export const GOD_TEXT = {
  alignment: 'Мировоззрение:',
  symbol: 'Символ:',
  domains: 'Домены:',
  pantheons: 'Пантеон:',
  otherSources: 'Информация из других источников',
  rank: 'Ранг:',
  titles: 'Титулы:',
} as const;

/* --- Правила ------------------------------------------------------------ */

export const RULES_SECTION: SectionConfig = {
  key: 'rules',
  title: 'Правила и термины',
  path: '/rules',
  listUrl: '/api/v1/rules',
  filterUrl: '/api/v1/filters/rules',
  order: [{ field: 'name', direction: 'asc' }],
};

export const RULE_CATEGORY_LABEL = 'Категория:';

/* --- Источники ---------------------------------------------------------- */

export const BOOKS_SECTION: SectionConfig = {
  key: 'books',
  title: 'Источники',
  path: '/books',
  listUrl: '/api/v1/books',
  order: [
    { field: 'year', direction: 'asc' },
    { field: 'name', direction: 'asc' },
  ],
};

export const BOOK_SHORT_NAME_LABEL = 'Аббревиатура:';

/* --- Ширма ------------------------------------------------------------- */

/**
 * В списке ширмы только корневые разделы; поиск ищет и по вложенным.
 * Ручки фильтра у ширмы на бэкенде нет.
 */
export const SCREENS_SECTION: SectionConfig = {
  key: 'screens',
  title: 'Ширма Мастера',
  path: '/screens',
  listUrl: '/api/v1/screens',
  order: [
    { field: 'ordering', direction: 'asc' },
    { field: 'name', direction: 'asc' },
  ],
};

export const SCREEN_TEXT = {
  parent: 'Раздел:',
} as const;

/** Иконка вложенного раздела, когда своей в базе нет. */
export const SCREEN_ICON_FALLBACK = 'tabler:book-2';

/** Теги SVG-иконки раздела ширмы, которые выводятся как есть. */
export const SVG_ALLOWED_TAGS: ReadonlySet<string> = new Set([
  'svg',
  'g',
  'path',
  'circle',
  'ellipse',
  'rect',
  'line',
  'polyline',
  'polygon',
]);

/** Атрибуты SVG-иконки: только геометрия, без ссылок, стилей и событий. */
export const SVG_ALLOWED_ATTRIBUTES: ReadonlySet<string> = new Set([
  'viewBox',
  'd',
  'fill',
  'fill-rule',
  'clip-rule',
  'fill-opacity',
  'opacity',
  'transform',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'points',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
]);

/** Цвет иконки берётся из текста, как в старом SPA. */
export const SVG_CURRENT_COLOR = 'currentColor';

/** Значение цвета, которое оставляется: прозрачная заливка или обводка. */
export const SVG_NO_PAINT = 'none';

/* --- Общее -------------------------------------------------------------- */

/** Разделитель значений в строке свойства: домены, титулы */
export const WIKI_LIST_SEPARATOR = ', ';
