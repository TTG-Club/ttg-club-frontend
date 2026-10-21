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

/* --- Общее -------------------------------------------------------------- */

/** Разделитель значений в строке свойства: домены, титулы */
export const WIKI_LIST_SEPARATOR = ', ';
