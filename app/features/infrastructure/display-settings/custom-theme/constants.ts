/** Заголовок блока своей темы. */
export const CUSTOM_THEME_TITLE = 'Своя тема';

export const CUSTOM_THEME_RESET_LABEL = 'Сбросить';

export const CUSTOM_THEME_BASE_TITLE = 'Основа';

export const CUSTOM_THEME_BASE_OPTIONS = [
  { value: 'dark', label: 'Тёмная', icon: 'tabler:moon' },
  { value: 'light', label: 'Светлая', icon: 'tabler:sun' },
] as const;

export const CUSTOM_THEME_LIGHTNESS_TITLE = 'Яркость фона';

export const CUSTOM_THEME_ACCENT_TITLE = 'Акцент';

export const CUSTOM_THEME_ACCENT_PICKER_LABEL = 'Выбрать свой цвет';

export const CUSTOM_THEME_HUE_TITLE = 'Оттенок фона';

export const CUSTOM_THEME_TINT_TITLE = 'Насыщенность фона';

/** Подпись насыщенности, когда серые тона без оттенка. */
export const CUSTOM_THEME_TINT_NEUTRAL_LABEL = 'нейтральный серый';

/** Шаг полоски оттенков под ползунком, в градусах. */
export const CUSTOM_THEME_HUE_GRADIENT_STEP = 30;

/** Светлота и насыщенность полоски оттенков — чтобы цвета были видны на любом фоне. */
export const CUSTOM_THEME_HUE_GRADIENT_COLOR = { lightness: 0.7, chroma: 0.12 };

/** Ползунки в процентах: яркость и насыщенность фона. */
export const CUSTOM_THEME_PERCENT_RANGE = { min: 0, max: 100 } as const;

/** Ползунок оттенка фона — круг OKLCH в градусах. */
export const CUSTOM_THEME_HUE_RANGE = { min: 0, max: 360 } as const;

/** Обводка кружка готового акцента: выбранный и остальные. */
export const CUSTOM_THEME_SWATCH_CLASS = {
  selected: 'outline-2 outline-primary',
  idle: 'outline-1 outline-default',
} as const;

/** Кнопка выбора своего цвета: подсвечена, когда акцент не из готовых. */
export const CUSTOM_THEME_PICKER_BUTTON = {
  selected: { variant: 'soft', color: 'primary' },
  idle: { variant: 'ghost', color: 'neutral' },
} as const;
