import type { SubraceLink } from './schema';

/** Компонент заклинания в карточке: подпись и подсказка с правилом. */
export interface SpellComponentLabel {
  key: string;
  label: string;
  hint: string;
}

/** Разновидности расы одного типа книги: основные, UA, хомбрю. */
export interface SubraceGroup {
  name: string;
  items: Array<SubraceLink>;
}

/** Короткая характеристика расы в карточке. */
export interface RaceStat {
  key: string;
  label: string;
  hint: string;
  value: string;
}
