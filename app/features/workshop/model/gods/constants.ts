import type { SelectOption } from '../types';

/** Ключ раздела богов в мастерской: и в адресе, и в ручках. */
export const GODS_WORKSHOP_KEY = 'gods';

/** Фильтры богов: из них берутся ранги, мировоззрения, домены, пантеоны. */
export const GODS_FILTER_PATH = '/api/v1/filters/gods';

/** Группы фильтров богов. */
export const GOD_FILTER_KEY = {
  alignment: 'alignment',
  domain: 'domain',
  rank: 'rank',
  pantheon: 'pantheon',
} as const;

/** Типы божеств. */
export const GOD_SEX_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'Бог', value: 'MALE' },
  { label: 'Богиня', value: 'FEMALE' },
  { label: 'Философия', value: 'PHILOSOPHY' },
  { label: 'Божество', value: 'UNDEFINE' },
];

/** Подписи редактора богов. */
export const GOD_EDITOR_TEXT = {
  editTitle: 'Редактирование божества',
  commitment: 'Сфера влияния',
  sex: 'Тип',
  rank: 'Ранг',
  alignment: 'Мировоззрение',
  pantheon: 'Пантеон',
  domains: 'Домены',
  symbol: 'Символ',
  nicknames: 'Титулы',
  nicknamesHelp: 'Через запятую',
  alternativeDescription: 'Альтернативное описание',
  saved: 'Божество обновлено',
  saveError: 'Не удалось сохранить божество',
} as const;

/** Строки описаний божества в редакторе. */
export const GOD_DESCRIPTION_ROWS = 18;

export const GOD_ALTERNATIVE_DESCRIPTION_ROWS = 12;
