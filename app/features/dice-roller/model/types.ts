/** Особый бросок по клику с модификатором: Shift — преимущество, Ctrl/Cmd — помеха. */
export type RollMode = 'advantage' | 'disadvantage';

/** Параметры броска из контента или таблицы. */
export interface RollRequest {
  formula: string;
  /** Подпись броска: «Урон», «Атака» и т.п. */
  label?: string;
  /** Откуда бросок: название заклинания, существа. */
  source?: string;
  mode?: RollMode;
}

/** Итог броска для показа и для таблиц бросков. */
export interface RollOutcome {
  value: number;
  /** Значения выпавших кубиков по порядку. */
  dice: Array<number>;
}
