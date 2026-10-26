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
  openImage: 'Открыть изображение',
  grouping: 'Группировка списка',
  previousImage: 'Предыдущее изображение',
  nextImage: 'Следующее изображение',
  openPage: 'Открыть страницу',
  detailEmpty: 'Запись не выбрана',
  detailEmptyHint: 'Выберите запись в списке, чтобы открыть её здесь',
  filters: 'Фильтры',
  filterSearch: 'Поиск по фильтрам...',
  filterSearchLabel: 'Поиск по фильтрам',
  sourceSearch: 'Поиск по источникам...',
  sourceSearchLabel: 'Поиск по источникам',
  selectAll: 'Выбрать все',
  more: 'Ещё',
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
  detailEmpty: 'tabler:click',
  more: 'tabler:dots',
  expand: 'tabler:chevron-down',
  imageCount: 'tabler:photo',
  zoom: 'tabler:zoom-in',
} as const;

/**
 * Поиск по фильтрам появляется, когда групп больше пяти или значений во всех
 * группах больше двадцати, как на new.ttg.club: короткий фильтр и так виден
 * целиком.
 */
export const FILTER_SEARCH_MIN_GROUPS = 5;
export const FILTER_SEARCH_MIN_VALUES = 20;

/** Задержка перед пересчётом групп под поиск по фильтрам. */
export const FILTER_SEARCH_DEBOUNCE_MS = 200;

/** Параметр адреса с открытой записью в широком режиме, как на new.ttg.club. */
export const SECTION_DETAIL_QUERY_KEY = 'detail';

/** Сегменты пути, которых не бывает в адресе записи. */
export const SECTION_DETAIL_FORBIDDEN_SEGMENTS: ReadonlySet<string> = new Set([
  '.',
  '..',
]);

/** Мастерская: правка записей, пока живёт в старом SPA. */
export const WORKSHOP_PREFIX = '/workshop';

export const WORKSHOP_EDIT_SUFFIX = '/edit';

/** Префикс API записей: адрес записи на сайте совпадает с её ручкой. */
export const SECTION_API_PREFIX = '/api/v1';

/**
 * Оттенок метки группы источника по её короткому названию. У официальных
 * и тестовых книг метка нейтральная.
 */
export const SOURCE_BADGE_CLASSES: Partial<Record<string, string>> = {
  'hb': 'homebrew',
  '3rd': 'thirdParty',
};

/** Цвет метки книги в шапке записи по группе; остальные — нейтральные. */
export const SOURCE_TAG_COLORS: Partial<
  Record<string, 'secondary' | 'success'>
> = {
  'hb': 'success',
  '3rd': 'secondary',
};

/** Где хранится ширина списка в широком режиме. */
export const SECTION_SPLIT_STORAGE_KEY = 'ttg-section-split';

/** Ширина списка в широком режиме, проценты: по умолчанию, меньше и больше. */
export const SECTION_SPLIT_DEFAULT_SIZE = 50;
export const SECTION_SPLIT_MIN_SIZE = 30;
export const SECTION_SPLIT_MAX_SIZE = 70;

/**
 * Сетка списка: плитки-строки справочника, крупные карточки рас и обложки
 * классов, как на new.ttg.club.
 */
export const SECTION_GRID_CLASS = {
  tiles:
    'grid grid-cols-1 gap-3 @lg:grid-cols-2 @3xl:grid-cols-3 @7xl:grid-cols-4',
  cards:
    'grid grid-cols-1 items-start gap-4 @lg:grid-cols-2 @3xl:grid-cols-3 @7xl:grid-cols-4',
  covers:
    'grid grid-cols-1 gap-3 @md:grid-cols-2 @xl:grid-cols-3 @4xl:grid-cols-4 @6xl:grid-cols-5 @7xl:grid-cols-6',
} as const;

/** Метки книг в фильтре источников: в тёмной теме текст белый. */
export const SOURCE_FILTER_BADGE_CLASS = 'dark:text-white';

/**
 * Сколько пикселей пройти пальцем по странице записи, чтобы перейти к
 * соседней записи списка.
 */
export const SECTION_SWIPE_THRESHOLD = 80;

/**
 * Во сколько раз сдвиг по горизонтали должен быть больше вертикального,
 * чтобы прокрутка страницы не листала записи.
 */
export const SECTION_SWIPE_AXIS_RATIO = 2;

/**
 * Мёртвая зона жеста, px: пока палец не ушёл дальше, запись стоит на месте.
 * С неё же начинается сдвиг, поэтому запись трогается плавно, а не прыжком.
 */
export const SECTION_SWIPE_DEADZONE = 8;

/**
 * Сопротивление, когда листать в эту сторону некуда: запись отходит за
 * пальцем лишь на четверть пути, жест виден, но ничем не закончится.
 */
export const SECTION_SWIPE_RESISTANCE = 0.25;

/** Доля ширины записи, на которой затухание под пальцем доходит до предела. */
export const SECTION_SWIPE_FADE_SPAN = 0.5;

/** Предел затухания записи под пальцем: 1 — до полной прозрачности. */
export const SECTION_SWIPE_MAX_FADE = 0.7;

/**
 * С какой доли ширины въезжает новая запись: с той стороны, куда вёл палец,
 * чтобы переход читался как перелистывание.
 */
export const SECTION_SWIPE_ENTER_SHIFT = 0.3;

/** Длительность ухода, въезда и возврата записи на место, мс. */
export const SECTION_SWIPE_DURATION_MS = 200;
