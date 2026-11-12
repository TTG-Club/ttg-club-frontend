import type { DmScreenResizeEdge, DmScreenSection } from './types';

import { DM_SCREEN_PAGE_PATH } from '~/shared/consts';
import { BESTIARY_SECTION } from '~bestiary/model';
import {
  BACKGROUNDS_SECTION,
  CLASSES_SECTION,
  FEATS_SECTION,
  OPTIONS_SECTION,
  RACES_SECTION,
  SPELLS_SECTION,
} from '~character/model';
import { getMenuLinkIcon } from '~infrastructure/sidebar/menu/model';
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

/** Страница ширмы. */
export const DM_SCREEN_PATH = DM_SCREEN_PAGE_PATH;

export const DM_SCREEN_TITLE = 'Ширма Мастера';

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

/** Страница подписки: она снимает ограничение на число ширм. */
export const DM_SCREEN_SUBSCRIPTION_PATH = '/profile/subscription';

/** Имя ширмы: сколько символов можно. */
export const DM_SCREEN_NAME_MAX_LENGTH = 64;

/** Имя ширмы, которую сайт создаёт сам: при первом «В ширму» и переносе. */
export const DM_SCREEN_DEFAULT_NAME = 'Моя ширма';

/** Дата изменения ширмы в списке: «12 ноября, 14:05». */
export const DM_SCREEN_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
};

export const DM_SCREEN_DATE_LOCALE = 'ru-RU';

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
 * Меньше этого окно не сжимается, px: видны шапка и начало записи. До этого
 * размера окна уменьшает и «Уменьшить все».
 */
export const DM_SCREEN_WINDOW_MIN_SIZE = { width: 240, height: 120 } as const;

/** Отступ окна от краёв экрана, px. */
export const DM_SCREEN_WINDOW_MARGIN = 16;

/**
 * Ширина боковой панели сайта (`--navbar-width` без безопасной зоны), px:
 * новое окно не встаёт под неё.
 */
export const DM_SCREEN_LEFT_INSET = 64;

/**
 * Высота шапки ширмы с заголовком и поиском, px: окна не встают и не
 * перетаскиваются под неё.
 */
export const DM_SCREEN_TOP_INSET = 72;

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

/**
 * Невидимые полосы по краям окна, за которые его растягивают: у каждой
 * стороны и угла — место и курсор. Углы шире, чтобы в них было легко
 * попасть, и лежат поверх сторон.
 */
export const DM_SCREEN_RESIZE_EDGES: ReadonlyArray<{
  edge: DmScreenResizeEdge;
  class: string;
}> = [
  { edge: 'n', class: 'inset-x-4 top-0 h-2 cursor-n-resize' },
  { edge: 's', class: 'inset-x-4 bottom-0 h-2 cursor-s-resize' },
  { edge: 'e', class: 'inset-y-4 right-0 w-2 cursor-e-resize' },
  { edge: 'w', class: 'inset-y-4 left-0 w-2 cursor-w-resize' },
  { edge: 'nw', class: 'top-0 left-0 z-10 size-4 cursor-nw-resize' },
  { edge: 'ne', class: 'top-0 right-0 z-10 size-4 cursor-ne-resize' },
  { edge: 'sw', class: 'bottom-0 left-0 z-10 size-4 cursor-sw-resize' },
  { edge: 'se', class: 'right-0 bottom-0 z-10 size-4 cursor-se-resize' },
];

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
  addNote: 'Заметка',
  noteTitle: 'Заметка',
  noteTitlePlaceholder: 'Название заметки',
  noteEdit: 'Править',
  noteDone: 'Готово',
  noteEmpty: 'Заметка пуста. Нажмите «Править», чтобы написать её.',
  noteTooLong:
    'Заметка слишком длинная: сократите её, иначе она не сохранится.',
  screens: 'Мои ширмы',
  allScreens: 'Все ширмы',
  create: 'Новая ширма',
  createTitle: 'Новая ширма',
  rename: 'Переименовать',
  renameTitle: 'Имя ширмы',
  namePlaceholder: 'Например, «Подземелье гоблинов»',
  save: 'Сохранить',
  cancel: 'Отмена',
  delete: 'Удалить',
  deleteTitle: 'Удалить ширму?',
  deleteDescription: 'Ширма и все её окна пропадут. Это нельзя отменить.',
  open: 'Открыть',
  entries: 'записей',
  updated: 'Изменена',
  limit: 'Ширм',
  limitReached:
    'Ширм уже столько, сколько можно. С подпиской можно вести до 30 ширм.',
  subscribe: 'Оформить подписку',
  listEmptyTitle: 'Ширм пока нет',
  listEmptyDescription:
    'Создайте ширму под игру или сцену: в неё можно сложить заклинания, монстров, правила и любые другие записи сайта.',
  loadFailed: 'Не удалось загрузить ширмы',
  screenLoadFailed: 'Не удалось открыть ширму',
  retry: 'Повторить',
  errorCreate: 'Не удалось создать ширму',
  errorRename: 'Не удалось переименовать ширму',
  errorDelete: 'Не удалось удалить ширму',
  errorSave: 'Не удалось сохранить ширму',
  errorAdd: 'Не удалось добавить в ширму',
  guestTitle: 'Ширма в этом браузере',
  guestDescription:
    'Войдите, чтобы ширмы сохранялись в аккаунте, открывались на любом устройстве и чтобы их можно было вести несколько.',
  signIn: 'Войти',
  guestImportTitle: 'В этом браузере есть ширма без входа',
  guestImportDescription:
    'Её можно сохранить в аккаунт отдельной ширмой, иначе она останется только в этом браузере.',
  guestImport: 'Сохранить в аккаунт',
  guestDiscard: 'Удалить её',
  pickTitle: 'В какую ширму?',
  pickDescription: 'Запись встанет окном в выбранную ширму.',
  minimizeAll: 'Свернуть все',
  shrinkAll: 'Уменьшить все',
  unknownEntry: 'Эту запись нельзя показать в ширме',
} as const;

export const DM_SCREEN_ICON = {
  screen: getMenuLinkIcon(DM_SCREEN_PAGE_PATH),
  minimize: 'tabler:minus',
  close: 'tabler:x',
  add: 'tabler:layout-grid-add',
  search: 'tabler:search',
  arrange: 'tabler:layout-grid',
  note: 'tabler:note',
  noteEdit: 'tabler:pencil',
  noteDone: 'tabler:check',
  create: 'tabler:plus',
  rename: 'tabler:pencil',
  delete: 'tabler:trash',
  back: 'tabler:arrow-left',
  subscribe: 'tabler:crown',
  signIn: 'tabler:login',
  import: 'tabler:cloud-upload',
  minimizeAll: 'tabler:layout-bottombar-collapse',
  shrinkAll: 'tabler:arrows-minimize',
  unknown: 'tabler:file-unknown',
} as const;
