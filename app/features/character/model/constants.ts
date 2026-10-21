import type { SectionConfig } from '~section/model';

import { SECTION_PAGE_SIZE_ALL } from '~section/model';

/** Подпись, когда у черты или особенности нет требований. */
export const CHARACTER_NO_REQUIREMENTS = 'Нет';

export const CHARACTER_LIST_SEPARATOR = ', ';

/* --- Черты -------------------------------------------------------------- */

/** Черт немного, поэтому список грузится целиком, как в старом SPA */
export const FEATS_SECTION: SectionConfig = {
  key: 'feats',
  title: 'Черты',
  path: '/feats',
  listUrl: '/api/v1/feats',
  filterUrl: '/api/v1/filters/feats',
  order: [{ field: 'name', direction: 'asc' }],
  pageSize: SECTION_PAGE_SIZE_ALL,
};

export const FEAT_TEXT = {
  requirements: 'Требования:',
} as const;

/* --- Предыстории -------------------------------------------------------- */

export const BACKGROUNDS_SECTION: SectionConfig = {
  key: 'backgrounds',
  title: 'Предыстории',
  path: '/backgrounds',
  listUrl: '/api/v1/backgrounds',
  filterUrl: '/api/v1/filters/backgrounds',
  order: [{ field: 'name', direction: 'asc' }],
  pageSize: SECTION_PAGE_SIZE_ALL,
};

export const BACKGROUND_TEXT = {
  skills: 'Владение навыками:',
  tools: 'Владение инструментами:',
  languages: 'Языки:',
  equipment: 'Снаряжение:',
  startGold: 'Начальный капитал:',
  goldUnit: 'зм.',
  description: 'Описание',
  skillFallback: 'Умение предыстории',
  personalization: 'Персонализация',
} as const;

/* --- Особенности классов ------------------------------------------------ */

export const OPTIONS_SECTION: SectionConfig = {
  key: 'options',
  title: 'Особенности классов',
  path: '/options',
  listUrl: '/api/v1/options',
  filterUrl: '/api/v1/filters/options',
  order: [{ field: 'name', direction: 'asc' }],
};

export const OPTION_TEXT = {
  classes: 'Классы:',
  classSeparator: ',',
} as const;
