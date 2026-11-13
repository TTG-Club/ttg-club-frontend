import type { DmScreenSnapPickerPosition } from './schema';
import type {
  DmScreenResizeHandle,
  DmScreenSection,
  DmScreenSnapLayout,
  DmScreenSnapPickerOption,
  DmScreenSnapZone,
} from './types';

import { DM_SCREEN_PAGE_PATH, DM_SCREEN_PAGE_TITLE } from '~/shared/consts';
import { BESTIARY_SECTION } from '~bestiary/model';
import {
  BACKGROUNDS_SECTION,
  CLASSES_SECTION,
  FEATS_SECTION,
  OPTIONS_SECTION,
  RACES_SECTION,
  SPELLS_SECTION,
} from '~character/model';
import {
  DM_SCREEN_MENU_ICON,
  getMenuLinkIcon,
} from '~infrastructure/navigation/model';
import {
  ARMORS_SECTION,
  ITEMS_SECTION,
  MAGIC_ITEMS_SECTION,
  WEAPONS_SECTION,
} from '~inventory/model';
import {
  BOOKS_SECTION,
  GODS_SECTION,
  RULES_SECTION,
  SCREENS_SECTION,
} from '~wiki/model';

import { dmScreenSnapPickerPositionSchema } from './schema';

/** Страница ширмы. */
export const DM_SCREEN_PATH = DM_SCREEN_PAGE_PATH;

export const DM_SCREEN_TITLE = DM_SCREEN_PAGE_TITLE;

/** Старый адрес черт: записи по нему тоже открываются в ширме. */
export const DM_SCREEN_TRAITS_PATH = '/traits';

/**
 * Разделы, чьи записи открываются в окнах ширмы: адрес раздела — начало
 * адреса записи, ключ — ключ загруженной записи в данных Nuxt, иконка — как
 * у раздела в меню.
 */
export const DM_SCREEN_SECTIONS: ReadonlyArray<DmScreenSection> = [
  SPELLS_SECTION,
  FEATS_SECTION,
  {
    ...FEATS_SECTION,
    path: DM_SCREEN_TRAITS_PATH,
    iconPath: FEATS_SECTION.path,
  },
  BACKGROUNDS_SECTION,
  OPTIONS_SECTION,
  RACES_SECTION,
  CLASSES_SECTION,
  WEAPONS_SECTION,
  ARMORS_SECTION,
  ITEMS_SECTION,
  MAGIC_ITEMS_SECTION,
  BESTIARY_SECTION,
  GODS_SECTION,
  RULES_SECTION,
  BOOKS_SECTION,
  SCREENS_SECTION,
].map((section) => ({
  key: section.key,
  path: section.path,
  icon: getMenuLinkIcon(
    'iconPath' in section ? section.iconPath : section.path,
  ),
}));

/** Ручки ширм пользователя на сервере. */
export const DM_SCREENS_API_URL = '/api/v1/dm-screens';

/** Имя ширмы: сколько символов можно. */
export const DM_SCREEN_NAME_MAX_LENGTH = 64;

/** Имя ширмы, которую сайт создаёт сам: при первом «В ширму» и переносе. */
export const DM_SCREEN_DEFAULT_NAME = 'Моя ширма';

/** Пауза перед сохранением ширмы на сервер после изменения окон, мс. */
export const DM_SCREEN_SAVE_DELAY = 800;

/**
 * Начало пути окна-заметки: у заметки нет страницы на сайте, путь только
 * отличает её от записей.
 */
export const DM_SCREEN_NOTE_PATH_PREFIX = 'note:';

/** Сколько символов разметки помещается в заметку. */
export const DM_SCREEN_NOTE_MAX_LENGTH = 20000;

/** Высота редактора заметки в строках. */
export const DM_SCREEN_NOTE_EDITOR_ROWS = 10;

/** Пауза перед записью текста заметки, пока его набирают, мс. */
export const DM_SCREEN_NOTE_SAVE_DELAY = 400;

/** Ключ окон ширмы в localStorage. */
export const DM_SCREEN_STORAGE_KEY = 'dm-screen:windows';

/** Размер нового окна, px. */
export const DM_SCREEN_WINDOW_SIZE = { width: 480, height: 600 } as const;

/**
 * Меньше этого окно не сжимается, px: видны шапка и начало записи.
 */
export const DM_SCREEN_WINDOW_MIN_SIZE = { width: 240, height: 120 } as const;

/**
 * Отступ окна от краёв холста, px: слева, справа и снизу — тот же, что
 * сверху от полосы под шапкой.
 */
export const DM_SCREEN_WINDOW_MARGIN = 8;

/**
 * Ширина боковой панели сайта (`--navbar-width` без безопасной зоны), px:
 * новое окно не встаёт под неё.
 */
export const DM_SCREEN_LEFT_INSET = 64;

/**
 * Высота шапки ширмы в одну строку вместе с полосой под ней, px: отступ
 * страницы, строка кнопок, отступ до полосы и сама полоса.
 */
export const DM_SCREEN_HEADER_HEIGHT = 65;

/**
 * Где под шапкой ширмы начинаются окна, px: окна не встают и не
 * перетаскиваются выше. Это место при шапке в одну строку; если кнопки
 * перенеслись на вторую, холст меряет шапку сам.
 */
export const DM_SCREEN_TOP_INSET =
  DM_SCREEN_HEADER_HEIGHT + DM_SCREEN_WINDOW_MARGIN;

/**
 * Ручки растягивания окна: четыре стороны и четыре угла. Углы идут после
 * сторон, поэтому в разметке лежат поверх них.
 */
export const DM_SCREEN_RESIZE_HANDLES: ReadonlyArray<DmScreenResizeHandle> = [
  {
    key: 'top',
    edges: { x: 0, y: -1 },
    class: 'inset-x-0 top-0 h-1.5 cursor-ns-resize',
  },
  {
    key: 'bottom',
    edges: { x: 0, y: 1 },
    class: 'inset-x-0 bottom-0 h-1.5 cursor-ns-resize',
  },
  {
    key: 'left',
    edges: { x: -1, y: 0 },
    class: 'inset-y-0 left-0 w-1.5 cursor-ew-resize',
  },
  {
    key: 'right',
    edges: { x: 1, y: 0 },
    class: 'inset-y-0 right-0 w-1.5 cursor-ew-resize',
  },
  {
    key: 'top-left',
    edges: { x: -1, y: -1 },
    class: 'top-0 left-0 size-3 cursor-nwse-resize',
  },
  {
    key: 'top-right',
    edges: { x: 1, y: -1 },
    class: 'top-0 right-0 size-3 cursor-nesw-resize',
  },
  {
    key: 'bottom-left',
    edges: { x: -1, y: 1 },
    class: 'bottom-0 left-0 size-3 cursor-nesw-resize',
  },
  {
    key: 'bottom-right',
    edges: { x: 1, y: 1 },
    class: 'right-0 bottom-0 size-3 cursor-nwse-resize',
  },
];

/**
 * Места ровной сетки раскладки: одинаковые клетки слева направо, сверху
 * вниз.
 * @param columns - сколько колонок
 * @param rows - сколько рядов
 */
function createGridZones(
  columns: number,
  rows: number,
): Array<DmScreenSnapZone> {
  return Array.from({ length: columns * rows }, (_, index) => ({
    x: (index % columns) / columns,
    y: Math.floor(index / columns) / rows,
    width: 1 / columns,
    height: 1 / rows,
  }));
}

/** Две половины холста: в них окно встаёт и у боковых краёв. */
export const DM_SCREEN_SNAP_HALVES: DmScreenSnapLayout = {
  key: 'columns-2',
  zones: createGridZones(2, 1),
};

/**
 * Раскладки в панели, которая появляется, когда окно тащат к верху холста.
 * Мельче, чем у окон Windows: карточки записей небольшие, на холст их
 * встаёт до восемнадцати. Набор тот же, что у ширмы на сайте 2024. В панели
 * раскладки идут в один ряд, а на узком холсте переносятся на второй.
 */
export const DM_SCREEN_SNAP_LAYOUTS: ReadonlyArray<DmScreenSnapLayout> = [
  DM_SCREEN_SNAP_HALVES,
  { key: 'columns-3', zones: createGridZones(3, 1) },
  { key: 'columns-4', zones: createGridZones(4, 1) },
  { key: 'columns-6', zones: createGridZones(6, 1) },
  { key: 'grid-2x2', zones: createGridZones(2, 2) },
  { key: 'grid-3x2', zones: createGridZones(3, 2) },
  { key: 'grid-4x2', zones: createGridZones(4, 2) },
  { key: 'grid-6x2', zones: createGridZones(6, 2) },
  { key: 'grid-3x3', zones: createGridZones(3, 3) },
  { key: 'grid-4x3', zones: createGridZones(4, 3) },
  { key: 'grid-6x3', zones: createGridZones(6, 3) },
  {
    key: 'main-top',
    zones: [
      { x: 0, y: 0, width: 1, height: 0.5 },
      { x: 0, y: 0.5, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
    ],
  },
  {
    key: 'main-wide',
    zones: [
      { x: 0, y: 0, width: 2 / 3, height: 1 },
      { x: 2 / 3, y: 0, width: 1 / 3, height: 0.5 },
      { x: 2 / 3, y: 0.5, width: 1 / 3, height: 0.5 },
    ],
  },
];

/**
 * Насколько близко к боковому краю холста нужно подвести указатель, чтобы
 * окно заняло половину, px.
 */
export const DM_SCREEN_SNAP_EDGE_DISTANCE = 24;

/**
 * Высота полосы под шапкой ширмы или у низа холста, px: пока указатель с
 * окном в ней, видна панель раскладок. Если панель выше (раскладки
 * перенеслись на второй ряд), полоса растёт вместе с ней.
 */
export const DM_SCREEN_SNAP_PICKER_DISTANCE = 132;

/** По чему в разметке панели раскладок находятся её места. */
export const DM_SCREEN_SNAP_ZONE_SELECTOR = '[data-zone]';

/** Отступ панели раскладок от шапки ширмы или от низа холста, px. */
export const DM_SCREEN_SNAP_PICKER_OFFSET = 8;

/** Ключ места панели раскладок в localStorage. */
export const DM_SCREEN_SNAP_PICKER_STORAGE_KEY =
  'dm-screen:snap-picker-position';

/** Места панели раскладок по именам: у верха холста, у низа, скрыта. */
export const DM_SCREEN_SNAP_PICKER_POSITION =
  dmScreenSnapPickerPositionSchema.enum;

/** Где панель раскладок, пока пользователь не выбрал сам. */
export const DM_SCREEN_SNAP_PICKER_DEFAULT_POSITION: DmScreenSnapPickerPosition =
  DM_SCREEN_SNAP_PICKER_POSITION.top;

/** Варианты места панели раскладок в её настройках. */
export const DM_SCREEN_SNAP_PICKER_POSITIONS: ReadonlyArray<DmScreenSnapPickerOption> =
  [
    {
      value: DM_SCREEN_SNAP_PICKER_POSITION.top,
      label: 'Сверху',
      icon: 'tabler:layout-navbar',
    },
    {
      value: DM_SCREEN_SNAP_PICKER_POSITION.bottom,
      label: 'Снизу',
      icon: 'tabler:layout-bottombar',
    },
    {
      value: DM_SCREEN_SNAP_PICKER_POSITION.hidden,
      label: 'Скрыть',
      icon: 'tabler:eye-off',
    },
  ];

/** Вид места в панели раскладок: под указателем и остальные. */
export const DM_SCREEN_SNAP_ZONE_CLASS = {
  active: 'border-primary bg-primary/40',
  idle: 'border-accented bg-accented/40',
} as const;

/**
 * На сколько промежуток между окнами может отличаться от промежутка сетки,
 * чтобы окна считались соседними, px: место и размер окна округляются.
 */
export const DM_SCREEN_DIVIDER_TOLERANCE = 1;

/**
 * Вид общей границы соседних окон: сама граница и полоска, которая
 * появляется на ней при наведении.
 */
export const DM_SCREEN_DIVIDER_CLASS = {
  vertical: { root: 'cursor-ew-resize', bar: 'h-16 max-h-full w-1' },
  horizontal: { root: 'cursor-ns-resize', bar: 'h-1 w-16 max-w-full' },
} as const;

/** Полоска на границе, пока границу тянут: видна и без наведения. */
export const DM_SCREEN_DIVIDER_ACTIVE_CLASS = 'opacity-100';

/**
 * Окно на втором плане, пока в раскладку подбирают окна: размыто, а в
 * режиме «производительность», где размытие выключено, приглушено.
 */
export const DM_SCREEN_BACKGROUND_CLASS =
  'blur-sm performance:opacity-40 performance:blur-none';

/** Рамка окна, на которое указали вместо нового. */
export const DM_SCREEN_HIGHLIGHT_CLASS = 'ring-2 ring-primary';

/**
 * Зазор между полосой под шапкой ширмы и окнами, px: как отступ окна от
 * остальных краёв холста.
 */
export const DM_SCREEN_TOP_GAP = DM_SCREEN_WINDOW_MARGIN;

/** Сколько подсвечивается окно, на которое указали вместо нового, мс. */
export const DM_SCREEN_HIGHLIGHT_DURATION = 1500;

/**
 * Сколько окна остаётся на экране по ширине, когда его утащили за край, px:
 * за эту часть его можно вытянуть обратно.
 */
export const DM_SCREEN_WINDOW_VISIBLE_PART = 96;

/** Высота шапки окна, px: шапка не уходит за нижний край экрана. */
export const DM_SCREEN_WINDOW_HEADER_HEIGHT = 40;

/**
 * Промежуток между окнами, px: в сетке и когда окно примагничивается
 * рядом с другим.
 */
export const DM_SCREEN_GRID_GAP = 12;

/**
 * Насколько близко край окна должен подойти к краю другого окна или холста,
 * чтобы примагнититься, px.
 */
export const DM_SCREEN_SNAP_DISTANCE = 12;

/** Сдвиг окна от точки клика, px. */
export const DM_SCREEN_CLICK_OFFSET = 16;

/** Сдвиг каждого следующего окна, открытого без точки клика, px. */
export const DM_SCREEN_CASCADE_STEP = 32;

/** Сколько окон лесенкой, прежде чем она начнётся заново. */
export const DM_SCREEN_CASCADE_LENGTH = 8;

/** Сколько результатов поиска показывать на ширме. */
export const DM_SCREEN_SEARCH_SIZE = 10;

export const DM_SCREEN_TEXT = {
  minimize: 'Свернуть окно',
  restore: 'Развернуть окно',
  close: 'Закрыть окно',
  dock: 'Свёрнутые окна ширмы',
  add: 'В ширму',
  added: 'Добавлено в ширму',
  openScreen: 'Открыть ширму',
  searchPlaceholder: 'Найти и добавить в ширму…',
  searchEmpty: 'Ничего не нашлось',
  emptyTitle: 'Ширма пуста',
  emptyDescription:
    'Найдите заклинание, монстра, правило или любую другую запись поиском выше или выберите «В ширму» в меню записи на сайте. Каждая запись встанет отдельным окном: его можно двигать, растягивать и сворачивать.',
  remove: 'Убрать из ширмы',
  arrange: 'Выровнять по сетке',
  snapAssistTitle: 'Что поставить сюда?',
  snapAssistSkip: 'Пропустить',
  snapAssistStop: 'Закончить',
  clear: 'Очистить',
  clearTitle: 'Очистить ширму?',
  clearDescription: 'Все окна и заметки пропадут с ширмы. Это нельзя отменить.',
  addNote: 'Заметка',
  noteTitle: 'Заметка',
  noteTitlePlaceholder: 'Название заметки',
  noteEdit: 'Править',
  noteDone: 'Готово',
  noteEmpty: 'Заметка пуста. Нажмите «Править», чтобы написать её.',
  noteTooLong:
    'Заметка слишком длинная: сократите её, иначе она не сохранится.',
  rename: 'Переименовать',
  renameTitle: 'Имя ширмы',
  namePlaceholder: 'Например, «Подземелье гоблинов»',
  save: 'Сохранить',
  cancel: 'Отмена',
  screenLoadFailed: 'Не удалось открыть ширму',
  retry: 'Повторить',
  errorRename: 'Не удалось переименовать ширму',
  errorSave: 'Не удалось сохранить ширму',
  errorAdd: 'Не удалось добавить в ширму',
  guestDescription:
    'Войдите, чтобы ширма сохранялась в аккаунте и открывалась на любом устройстве.',
  signIn: 'Войти',
  pickTitle: 'В какую ширму?',
  pickDescription: 'Запись встанет окном в выбранную ширму.',
  minimizeAll: 'Свернуть все',
  restoreAll: 'Развернуть все',
  snapPickerSettings: 'Панель раскладок',
  unknownEntry: 'Эту запись нельзя показать в ширме',
} as const;

export const DM_SCREEN_ICON = {
  screen: DM_SCREEN_MENU_ICON,
  minimize: 'tabler:minus',
  close: 'tabler:x',
  add: 'tabler:layout-grid-add',
  search: 'tabler:search',
  arrange: 'tabler:layout-grid',
  note: 'tabler:note',
  noteEdit: 'tabler:pencil',
  noteDone: 'tabler:check',
  rename: 'tabler:pencil',
  delete: 'tabler:trash',
  signIn: 'tabler:login',
  minimizeAll: 'tabler:layout-bottombar-collapse',
  restoreAll: 'tabler:layout-bottombar-expand',
  snapPickerSettings: 'tabler:adjustments-horizontal',
  unknown: 'tabler:file-unknown',
} as const;
