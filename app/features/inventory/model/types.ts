import type { ContentDescription } from '~content/model';

import type { ITEMS_GROUPINGS } from './constants';

/** Часть подписи типа магического предмета: текст или ссылка. */
export interface MagicItemTypePart {
  key: string;
  text: string;
  url?: string;
  /** Уточнение разметкой core-api: выводится в строку вместо `text`. */
  content?: ContentDescription;
}

/** Группировка списка снаряжения. */
export type ItemsGrouping = (typeof ITEMS_GROUPINGS)[number];
