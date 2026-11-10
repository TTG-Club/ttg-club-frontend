import type { ThemeMode } from '#shared/consts';
import type { CharacterListView } from '~/shared/consts';

import type { DisplaySettingsOption } from './choice';

export const THEME_OPTIONS = [
  { value: 'light', label: 'Светлая', icon: 'tabler:sun' },
  { value: 'dark', label: 'Тёмная', icon: 'tabler:moon' },
  { value: 'svifty7', label: 'svifty7', icon: 'tabler:palette' },
  { value: 'custom', label: 'Своя', icon: 'tabler:color-swatch' },
  { value: 'auto', label: 'Как в системе', icon: 'tabler:device-desktop' },
] as const satisfies ReadonlyArray<DisplaySettingsOption<ThemeMode>>;

export const DISPLAY_SETTINGS_ARIA = 'Настройки отображения';
export const THEME_SECTION_TITLE = 'Тема';

/** Заголовок группы настроек оформления. */
export const APPEARANCE_GROUP_TITLE = 'Оформление';

/** Заголовок группы настроек разделов справочника. */
export const SECTIONS_GROUP_TITLE = 'Разделы справочника';

/** Настройка раскладки разделов. */
export const SECTION_LAYOUT_SETTING_TITLE = 'Раскладка';

/** Почему колонки рядом недоступны. */
export const SECTION_LAYOUT_UNAVAILABLE_HINT = 'колонки — на экране от 1024 px';

/**
 * Раскладки разделов: две узкие — запись поверх списка или рядом с ним в
 * колонке по центру, как в старом SPA, — и шесть широких, где
 * колонки фильтров, списка и записи стоят в разном порядке. Каждая —
 * сочетание ширины сайта, места фильтров, стороны записи и узкой колонки.
 */
export const SECTION_LAYOUT_OPTIONS = [
  {
    value: 'default',
    label: 'Узкая · запись поверх списка',
    width: 'default',
    filters: 'left',
    detail: 'right',
    centered: false,
  },
  {
    value: 'centered',
    label: 'Узкая · список и запись рядом',
    width: 'wide',
    filters: 'top',
    detail: 'right',
    centered: true,
  },
  {
    value: 'left-right',
    label: 'Фильтры · список · запись',
    width: 'wide',
    filters: 'left',
    detail: 'right',
    centered: false,
  },
  {
    value: 'left-left',
    label: 'Фильтры · запись · список',
    width: 'wide',
    filters: 'left',
    detail: 'left',
    centered: false,
  },
  {
    value: 'top-right',
    label: 'Фильтры над списком · запись',
    width: 'wide',
    filters: 'top',
    detail: 'right',
    centered: false,
  },
  {
    value: 'right-right',
    label: 'Список · запись · фильтры',
    width: 'wide',
    filters: 'right',
    detail: 'right',
    centered: false,
  },
  {
    value: 'right-left',
    label: 'Запись · список · фильтры',
    width: 'wide',
    filters: 'right',
    detail: 'left',
    centered: false,
  },
  {
    value: 'top-left',
    label: 'Запись · фильтры над списком',
    width: 'wide',
    filters: 'top',
    detail: 'left',
    centered: false,
  },
] as const;

/** Настройка вида списков разделов. */
export const LIST_VIEW_SETTING_TITLE = 'Списки';

/** Настройка вида списков классов и видов. */
export const CHARACTER_VIEW_SETTING_TITLE = 'Классы и виды';

/** При списках строками классы и виды тоже строками. */
export const CHARACTER_VIEW_ROWS_HINT = 'при списках строками — «Модерн»';

export const CHARACTER_VIEW_OPTIONS = [
  { value: 'modern', label: 'Модерн', icon: 'tabler:layout-list' },
  { value: 'covers', label: 'Обложки', icon: 'tabler:layout-grid' },
] as const satisfies ReadonlyArray<DisplaySettingsOption<CharacterListView>>;
