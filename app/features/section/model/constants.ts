/** Параметр источников в запросе и в адресе. */
export const SOURCES_PARAM = 'book';

/** Параметр поиска в адресе. */
export const SEARCH_QUERY_KEY = 'search';

/** Разделитель значений одного параметра в адресе. */
export const QUERY_VALUES_SEPARATOR = ',';

/** Размер страницы списка, как в старом SPA. */
export const SECTION_PAGE_SIZE = 60;

/** Размер страницы «весь раздел сразу»: так его понимает бэкенд. */
export const SECTION_PAGE_SIZE_ALL = -1;

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
  resetAll: 'Сбросить фильтр и источники',
  close: 'Закрыть',
  empty: 'Ничего не найдено',
  error: 'Не удалось загрузить список',
  detailError: 'Не удалось загрузить запись',
  retry: 'Повторить',
  copyLink: 'Скопировать ссылку',
  linkCopied: 'Ссылка скопирована',
  copyError: 'Не удалось скопировать ссылку',
  edit: 'Редактировать',
  source: 'Источник:',
  openImage: 'Открыть изображение',
  previousImage: 'Предыдущее изображение',
  nextImage: 'Следующее изображение',
  openPage: 'Открыть страницу',
} as const;

/** Иконки раздела. */
export const SECTION_ICON = {
  search: 'tabler:search',
  filter: 'tabler:filter',
  sources: 'tabler:books',
  reset: 'tabler:filter-off',
  close: 'tabler:x',
  empty: 'tabler:mood-empty',
  copy: 'tabler:link',
  edit: 'tabler:pencil',
  previous: 'tabler:chevron-left',
  next: 'tabler:chevron-right',
  openPage: 'tabler:external-link',
} as const;

/** Мастерская: правка записей, пока живёт в старом SPA. */
export const WORKSHOP_PREFIX = '/workshop';

export const WORKSHOP_EDIT_SUFFIX = '/edit';

/** Префикс API записей: адрес записи на сайте совпадает с её ручкой. */
export const SECTION_API_PREFIX = '/api/v1';

/**
 * Группы источников, которые подписываются рядом с книгой, как в старом
 * SPA: у официальных и тестовых книг подпись группы ничего не добавляет.
 */
export const SOURCE_GROUPS_WITH_LABEL: ReadonlySet<string> = new Set([
  '3rd',
  'HB',
]);

/**
 * Оттенок метки группы источника по её короткому названию. У официальных
 * и тестовых книг метка нейтральная.
 */
export const SOURCE_BADGE_CLASSES: Partial<Record<string, string>> = {
  'hb': 'homebrew',
  '3rd': 'thirdParty',
};
