/** Ручка поиска по сайту. */
export const SEARCH_API_URL = '/api/v1/search';

/** Ручка случайных записей для кнопки с кубиком. */
export const SEARCH_RANDOM_API_URL = '/api/v1/search/random';

/** Страница поиска. */
export const SEARCH_PAGE_PATH = '/search';

/** Параметр строки поиска в адресе, как в старом SPA. */
export const SEARCH_QUERY_KEY = 'search';

/** Параметр номера страницы в адресе. */
export const SEARCH_PAGE_QUERY_KEY = 'page';

/** Сколько результатов показывает окно поиска, как в старом SPA. */
export const SEARCH_PALETTE_SIZE = 5;

/** Сколько результатов на одной странице поиска. */
export const SEARCH_PAGE_SIZE = 20;

/** Задержка запроса после набора. */
export const SEARCH_DEBOUNCE_MS = 300;

/** Горячие клавиши окна поиска: из старого SPA и привычная ⌘K. */
export const SEARCH_SHORTCUT_KEYS = ['/', '\\', 'meta_k'];

export const SEARCH_TEXT = {
  title: 'Поиск по сайту',
  open: 'Поиск',
  placeholder: 'Поиск...',
  pagePlaceholder: 'Поиск по сайту...',
  start: 'Введите текст, чтобы начать',
  loading: 'Боги ищут ответ на твой запрос',
  empty: 'Боги не нашли ответа на твой запрос',
  error: 'Произошла ошибка, попробуйте ещё раз',
  found: 'Найдено:',
  random: 'Показать случайные записи',
  openPage: 'Открыть страницу поиска',
  range: 'Результат:',
  of: 'из',
} as const;

export const SEARCH_ICON = {
  search: 'tabler:search',
  random: 'ttg:dice-d20',
  page: 'tabler:file-search',
} as const;
