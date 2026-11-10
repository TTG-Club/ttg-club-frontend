import type { ListColumnCount } from '~/shared/consts';

/** Сколько рядов карточек нарисовано на миниатюре вида «карточками». */
export const LIST_PREVIEW_CARD_ROW_COUNT = 2;

/** Сколько строк нарисовано на миниатюре вида «строками». */
export const LIST_PREVIEW_ROW_COUNT = 3;

/** Сетка миниатюры по числу колонок карточек; у строк сетки нет. */
export const LIST_PREVIEW_GRID_CLASS: Partial<Record<ListColumnCount, string>> =
  {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };
