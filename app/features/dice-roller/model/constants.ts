/** Подпись броска по умолчанию. */
export const DEFAULT_ROLL_LABEL = 'Бросок';

/** Подсказка над формулой броска. */
export const ROLL_HINT = 'Нажмите для броска:';

/** Иконка уведомления о броске. */
export const ROLL_TOAST_ICON = 'tabler:dice-5';

/** Подпись выпавших кубиков в уведомлении. */
export const ROLL_DICE_LABEL = 'Кубики';

/** Текст ошибки броска, как в старом SPA. */
export const ROLL_ERROR_TEXT = 'Произошла ошибка, попробуйте еще раз...';

/** Пометки особых бросков к20. */
export const D20_MODE_SUFFIX = {
  advantage: ' (преимущество)',
  disadvantage: ' (помеха)',
} as const;

/** Пометки особых бросков других кубиков. */
export const OTHER_MODE_SUFFIX = {
  advantage: ' (удвоенный бросок)',
  disadvantage: ' (1/2)',
} as const;

/** Сколько бросков хранится в истории, как в старом SPA. */
export const ROLL_HISTORY_LIMIT = 100;

/** Ключ истории бросков в localStorage. */
export const ROLL_HISTORY_STORAGE_KEY = 'ttg-dice-history';

/** Ключ признака открытой истории в localStorage. */
export const ROLL_HISTORY_OPEN_STORAGE_KEY = 'ttg-dice-history-open';

/** Тексты истории бросков. */
export const ROLL_HISTORY_TEXT = {
  title: 'История бросков',
  clear: 'Очистить историю',
  empty: 'Здесь появятся ваши броски',
  placeholder: 'Введите формулу',
  inputLabel: 'Формула для броска',
  invalidFormula: 'Неверная формула для броска',
  formulaSource: 'Бросок по формуле',
} as const;

/** Иконки истории бросков. */
export const ROLL_HISTORY_ICON = {
  open: 'tabler:dice-5',
  close: 'tabler:x',
  clear: 'tabler:trash',
  roll: 'tabler:dice-5',
} as const;

/** Формат времени броска в истории. */
export const ROLL_HISTORY_TIME_FORMAT = 'HH:mm';
