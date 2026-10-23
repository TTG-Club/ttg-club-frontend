/**
 * Вид броска: соответствует модификаторам тега `dice-roller`.
 * `dice` — обычный дайс, остальные добавляют атрибут `is-*`.
 */
export type DiceVariant =
  'dice' | 'advantage' | 'disadvantage' | 'saving-throw';

/** Данные тега `dice-roller` внутри описания. */
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

/** Ошибка разметки, из-за которой бэкенд отклонит описание. */
export interface HtmlProblem {
  /** Что не так — простыми словами. */
  message: string;
  /** Начало проблемного тега в исходной разметке. */
  start: number;
  /** Конец проблемного тега в исходной разметке. */
  end: number;
  /** Текст рядом с ошибкой, чтобы её было легко найти глазами. */
  context: string;
}

/** Открытый тег при разборе разметки. */
export interface OpenTag {
  name: string;
  start: number;
  end: number;
}

/** Кнопка панели, которая выполняет команду `execCommand`. */
export interface HtmlEditorCommand {
  command: string;
  icon: string;
  title: string;
  /** Пишет оформление в `style`, а не в устаревшие атрибуты. */
  isStyled?: boolean;
}

/** Ошибка поля формы для `UForm`. */
export interface HtmlFieldError {
  name: string;
  message: string;
}
