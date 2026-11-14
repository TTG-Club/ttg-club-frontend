import type { ListColumnCount } from '~/shared/consts';

import type { SourcePreset } from './types';

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

/** Значение единственного элемента общего аккордеона записи. */
export const SECTION_COLLAPSE_VALUE = 'section-collapse';

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
  titleCopied: 'Название скопировано',
  titleCopyError: 'Не удалось скопировать название',
  edit: 'Редактировать',
  openImage: 'Открыть изображение',
  grouping: 'Группировка',
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
  clearAll: 'Снять все',
  /** Сводка под заголовком панели источников: «Выбрано 3 из 24». */
  sourcesSelected: 'Выбрано',
  sourcesOf: 'из',
  more: 'Ещё',
  actions: 'Действия с записью',
  print: 'Печать',
  exportError: 'Не удалось выгрузить запись',
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
  copyTitle: 'tabler:copy',
  edit: 'tabler:pencil',
  previous: 'tabler:chevron-left',
  next: 'tabler:chevron-right',
  openPage: 'tabler:external-link',
  detailEmpty: 'tabler:click',
  more: 'tabler:dots',
  grouping: 'tabler:list-tree',
  expand: 'tabler:chevron-down',
  imageCount: 'tabler:photo',
  zoom: 'tabler:zoom-in',
  print: 'tabler:printer',
  export: 'tabler:file-export',
  selectAll: 'tabler:checks',
  clearAll: 'tabler:square-off',
  /** Место обложки у книги в панели источников. */
  book: 'tabler:book',
  /** Отметка на обложке выбранной книги. */
  checked: 'tabler:check',
  /** Стрелка группы источников: у раскрытой повёрнута вниз. */
  groupToggle: 'tabler:chevron-right',
} as const;

/** Платформы экспорта записи в JSON, как в старом SPA. */
export enum EntryExportPlatform {
  FOUNDRY = 'fvtt',
  LSS = 'lss',
}

/** Подписи пунктов экспорта. */
export const ENTRY_EXPORT_LABELS: Record<EntryExportPlatform, string> = {
  [EntryExportPlatform.FOUNDRY]: 'Экспорт для FVTT (JSON)',
  [EntryExportPlatform.LSS]: 'Экспорт для LSS (JSON)',
};

/** Расширение выгружаемого файла, если сервер не назвал его сам. */
export const ENTRY_EXPORT_EXTENSION = '.json';

/** Имя файла в заголовке ответа: `attachment; filename="Fire Bolt.json"`. */
export const CONTENT_DISPOSITION_FILENAME = /filename="?([^";]+)"?/;

/**
 * Поиск по фильтрам появляется, когда групп больше пяти или значений во всех
 * группах больше двадцати, как на new.ttg.club: короткий фильтр и так виден
 * целиком.
 */
export const FILTER_SEARCH_MIN_GROUPS = 5;
export const FILTER_SEARCH_MIN_VALUES = 20;

/** Задержка перед пересчётом групп под поиск по фильтрам. */
export const FILTER_SEARCH_DEBOUNCE_MS = 200;

/**
 * Сторона и ширина панелей фильтра и источников. Общие у обеих: они
 * открываются кнопками в начале строки фильтров раздела и выезжают с той же
 * стороны одинаковыми, как на new.ttg.club. Вариант `sm:` перебивает
 * штатную ширину панели Nuxt UI на широком экране.
 */
export const FILTER_DRAWER_SIDE = 'left';

export const FILTER_DRAWER_UI = {
  content: 'w-full max-w-240 min-w-80 sm:max-w-240',
};

/**
 * Начало имени cookie с выбранным фильтром раздела: выбор переживает уход
 * со списка, как в старом SPA, а сервер сразу отдаёт отфильтрованный список.
 */
export const SECTION_FILTER_COOKIE_PREFIX = 'ttg_section_filter_';

/** Сколько секунд помнить выбранный фильтр раздела. */
export const SECTION_FILTER_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** Параметр адреса с открытой записью в широком режиме, как на new.ttg.club. */
export const SECTION_DETAIL_QUERY_KEY = 'detail';

/**
 * Параметр адреса: открыть печать записи. Запись рядом со списком
 * печатается со своей страницы, где вёрстка не зависит от ширины листа.
 */
export const SECTION_PRINT_QUERY_KEY = 'print';

/** Значение параметра печати. */
export const SECTION_PRINT_QUERY_VALUE = '1';

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

/**
 * Сетка списка: плитки-строки справочника, крупные карточки рас, обложки
 * классов и видов и строки — по наибольшему числу колонок из настройки
 * вида списков (1 — строками). Колонки считаются от ширины самого списка:
 * в широком режиме рядом стоит запись, и списку достаётся меньше места.
 */
export const SECTION_GRID_CLASS = {
  tiles: {
    1: 'grid grid-cols-1 gap-3',
    2: 'grid grid-cols-1 gap-3 @lg:grid-cols-2',
    3: 'grid grid-cols-1 gap-3 @lg:grid-cols-2 @3xl:grid-cols-3',
    4: 'grid grid-cols-1 gap-3 @lg:grid-cols-2 @3xl:grid-cols-3 @7xl:grid-cols-4',
  },
  cards: {
    1: 'grid grid-cols-1 items-start gap-4',
    2: 'grid grid-cols-1 items-start gap-4 @lg:grid-cols-2',
    3: 'grid grid-cols-1 items-start gap-4 @lg:grid-cols-2 @3xl:grid-cols-3',
    4: 'grid grid-cols-1 items-start gap-4 @lg:grid-cols-2 @3xl:grid-cols-3 @7xl:grid-cols-4',
  },
  covers: {
    1: 'grid grid-cols-1 gap-3',
    2: 'grid grid-cols-1 gap-3 @md:grid-cols-2',
    3: 'grid grid-cols-1 gap-3 @md:grid-cols-2 @xl:grid-cols-3',
    4: 'grid grid-cols-1 gap-3 @md:grid-cols-2 @xl:grid-cols-3 @4xl:grid-cols-4',
  },
  rows: {
    1: 'grid grid-cols-1 items-start gap-4',
    2: 'grid grid-cols-1 items-start gap-4 @3xl:grid-cols-2',
    3: 'grid grid-cols-1 items-start gap-4 @3xl:grid-cols-2 @6xl:grid-cols-3',
    4: 'grid grid-cols-1 items-start gap-4 @3xl:grid-cols-2 @6xl:grid-cols-3',
  },
} as const satisfies Record<string, Record<ListColumnCount, string>>;

/** Сетка плиток вне списков разделов (добыча): все колонки, что поместятся. */
export const SECTION_TILES_GRID_CLASS = SECTION_GRID_CLASS.tiles[4];

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

/**
 * Общий список книг: из него панель источников берёт английские названия.
 * Размер `-1` — все книги сразу.
 */
export const SOURCE_CATALOG_PATH = '/api/v1/books';

export const SOURCE_CATALOG_QUERY = { page: 0, size: -1 } as const;

/** Ключ кэша списка книг: один на панели всех разделов. */
export const SOURCE_CATALOG_KEY = 'section-source-catalog';

/**
 * Быстрые наборы над списком источников, как на new.ttg.club. Ключи — группы
 * источников из фильтров разделов; `OFFICAL` с опечаткой — так его отдаёт API.
 */
export const SOURCE_PRESETS: ReadonlyArray<SourcePreset> = [
  { id: 'official', label: 'Только базовые', keys: ['OFFICAL'] },
  {
    id: 'official-settings',
    label: 'Базовые и сеттинги',
    keys: ['OFFICAL', 'SETTING'],
  },
];
