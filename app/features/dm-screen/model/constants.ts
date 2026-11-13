import type { DmScreenSection } from './types';

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
 * перетаскиваются под неё. Это высота шапки в одну строку; если кнопки
 * перенеслись на вторую, холст меряет шапку сам.
 */
export const DM_SCREEN_TOP_INSET = 72;

/** Зазор между полосой под шапкой ширмы и окнами, px. */
export const DM_SCREEN_TOP_GAP = 7;

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
    'Ширм уже столько, сколько можно. Чтобы создать новую, удалите одну из них.',
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
    'Войдите, чтобы ширма сохранялась в аккаунте и открывалась на любом устройстве.',
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
  limit: 'tabler:info-circle',
  signIn: 'tabler:login',
  import: 'tabler:cloud-upload',
  minimizeAll: 'tabler:layout-bottombar-collapse',
  shrinkAll: 'tabler:arrows-minimize',
  unknown: 'tabler:file-unknown',
} as const;
