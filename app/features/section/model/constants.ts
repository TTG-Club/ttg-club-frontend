/** Параметр источников в запросе и в адресе. */
export const SOURCES_PARAM = 'book';

/** Параметр поиска в адресе. */
export const SEARCH_QUERY_KEY = 'search';

/** Разделитель значений одного параметра в адресе. */
export const QUERY_VALUES_SEPARATOR = ',';

/** Размер страницы списка, как в старом SPA. */
export const SECTION_PAGE_SIZE = 60;

/** Задержка перед записью поиска в адрес. */
export const SEARCH_DEBOUNCE_MS = 400;

/** Сколько пикселей до конца списка начинать подгрузку. */
export const INFINITE_SCROLL_DISTANCE = 1080;

/** Тексты раздела. */
export const SECTION_TEXT = {
  searchPlaceholder: 'Поиск...',
  searchLabel: 'Поиск по разделу',
  filter: 'Фильтр',
  filterTitle: 'Фильтр',
  sources: 'Источники',
  reset: 'Сбросить',
  close: 'Закрыть',
  empty: 'Ничего не найдено',
  error: 'Не удалось загрузить список',
  detailError: 'Не удалось загрузить запись',
  retry: 'Повторить',
} as const;

/** Иконки раздела. */
export const SECTION_ICON = {
  search: 'tabler:search',
  filter: 'tabler:filter',
  reset: 'tabler:filter-off',
  close: 'tabler:x',
  empty: 'tabler:mood-empty',
} as const;
