/**
 * Вид броска — соответствует модификаторам компонента `DiceRoller`.
 * `dice` — обычный дайс, остальные добавляют флаг `is-*` в разметку.
 */
export type DiceVariant =
  | 'dice'
  | 'advantage'
  | 'disadvantage'
  | 'saving-throw';

/** Данные тега `<dice-roller>` внутри описания. */
export interface DiceToken {
  /** Формула броска, например `2к6 + 3`. */
  formula: string;
  /** Текст, который видит пользователь. По умолчанию совпадает с формулой. */
  text: string;
  /** Подпись броска в уведомлении (`Атака`, `Урон` и т.д.). */
  label: string;
  /** Источник броска в уведомлении. */
  source: string;
  variant: DiceVariant;
}

/** Режим редактора: визуальный или правка исходного кода. */
export type HtmlEditorMode = 'html' | 'source';
