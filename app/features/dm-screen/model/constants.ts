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

/** Ключ окон ширмы в localStorage. */
export const DM_SCREEN_STORAGE_KEY = 'dm-screen:windows';

/** Размер нового окна, px. */
export const DM_SCREEN_WINDOW_SIZE = { width: 480, height: 600 } as const;

/** Меньше этого окно не сжимается, px. */
export const DM_SCREEN_WINDOW_MIN_SIZE = { width: 320, height: 240 } as const;

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

/** Промежуток между окнами, разложенными по сетке, px. */
export const DM_SCREEN_GRID_GAP = 12;

/** Сдвиг окна от точки клика, px. */
export const DM_SCREEN_CLICK_OFFSET = 16;

/** Сдвиг каждого следующего окна, открытого без точки клика, px. */
export const DM_SCREEN_CASCADE_STEP = 32;

/** Сколько окон лесенкой, прежде чем она начнётся заново. */
export const DM_SCREEN_CASCADE_LENGTH = 8;

/** Пауза перед сохранением размера при растягивании окна, мс. */
export const DM_SCREEN_RESIZE_SAVE_DELAY = 300;

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
  minimizeAll: 'Свернуть все',
  unknownEntry: 'Эту запись нельзя показать в ширме',
} as const;

export const DM_SCREEN_ICON = {
  screen: getMenuLinkIcon(DM_SCREEN_PAGE_PATH),
  minimize: 'tabler:minus',
  close: 'tabler:x',
  add: 'tabler:layout-grid-add',
  search: 'tabler:search',
  arrange: 'tabler:layout-grid',
  minimizeAll: 'tabler:layout-bottombar-collapse',
  unknown: 'tabler:file-unknown',
} as const;
