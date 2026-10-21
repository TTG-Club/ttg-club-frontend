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
