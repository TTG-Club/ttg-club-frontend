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
  critical?: RollCritical;
}

/** Критический результат к20: натуральные 20 или 1. */
export type RollCritical = 'success' | 'failure';

/** Бросок в истории. */
export interface RollEntry {
  id: string;
  /** Время броска в ISO. */
  date: string;
  formula: string;
  value: number;
  dice: Array<number>;
  /** Подпись вместе с пометкой особого броска. */
  label: string;
  source?: string;
  critical?: RollCritical;
}
