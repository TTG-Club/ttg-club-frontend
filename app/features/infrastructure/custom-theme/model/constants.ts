import type {
  CustomThemeBase,
  CustomThemeSettings,
  CustomThemeSurfaces,
  CustomThemeTextTargets,
} from './types';

/** Класс на `<html>`, под которым действуют переменные своей темы. */
export const CUSTOM_THEME_CLASS = 'ttg-custom-theme';

/** Ключ тега `<style>` с переменными своей темы. */
export const CUSTOM_THEME_STYLE_KEY = 'ttg-custom-theme';

/**
 * Яркость фона по умолчанию для каждой основы: у тёмной — сине-серый фон
 * тёмной темы сайта (`#131a20`), у светлой — бумага светлой (`#f9f6f1`).
 * Ставится при смене основы.
 */
export const CUSTOM_THEME_DEFAULT_LIGHTNESS: Record<CustomThemeBase, number> = {
  dark: 46,
  light: 78,
};

/**
 * Светлота OKLCH, ниже которой фон считается тёмным. Цвет между пределами
 * основ подтягивается к ближайшему краю — середина не читается ни светлым, ни
 * тёмным текстом.
 */
export const CUSTOM_THEME_BASE_THRESHOLD = 0.6;

/**
 * Наибольшая насыщенность фона: ярче фон отвлекает от текста, поэтому
 * сочный цвет приглушается.
 */
export const CUSTOM_THEME_MAX_BACKGROUND_CHROMA = 0.08;

/** Наибольшая насыщенность текста — цветной текст кажется грязным. */
export const CUSTOM_THEME_MAX_TEXT_CHROMA = 0.012;

/**
 * Настройки по умолчанию — повторяют тёмную тему сайта: сине-серый фон и
 * синий акцент.
 */
export const CUSTOM_THEME_DEFAULT_SETTINGS: CustomThemeSettings = {
  background: '#131a20',
  accent: '#5691c7',
};

/** Готовые фоны для быстрого выбора: сначала тёмные, потом светлые. */
export const CUSTOM_THEME_BACKGROUND_PRESETS = [
  { label: 'Графит', value: '#15171b' },
  { label: 'Чёрный', value: '#0b0b0b' },
  { label: 'Ночь', value: '#0d1626' },
  { label: 'Лес', value: '#0c1c12' },
  { label: 'Вино', value: '#250e12' },
  { label: 'Какао', value: '#24180f' },
  { label: 'Бумага', value: '#f5f8fe' },
  { label: 'Пергамент', value: '#f8edd8' },
  { label: 'Мята', value: '#e2f8ef' },
  { label: 'Белый', value: '#fcfcfc' },
] as const;

/**
 * Поверхности основ. Сдвиги сняты с тёмной (графит) и светлой (бумага и
 * белые карточки) тем new.ttg.club.
 */
export const CUSTOM_THEME_SURFACES: Record<
  CustomThemeBase,
  CustomThemeSurfaces
> = {
  dark: {
    pageRange: [0.14, 0.3],
    card: 0.026,
    elevated: 0.044,
    accented: 0.065,
    borderMuted: 0.048,
    border: 0.091,
    borderAccented: 0.145,
    inverted: 0.89,
  },
  light: {
    pageRange: [0.9, 0.995],
    card: 0.022,
    elevated: -0.034,
    accented: -0.053,
    borderMuted: -0.034,
    border: -0.062,
    borderAccented: -0.118,
    inverted: 0.3,
  },
};

/**
 * Пороги контраста текста по APCA. На тёмном фоне текст намеренно приглушён:
 * яркий светлый текст при долгом чтении режет глаза.
 */
export const CUSTOM_THEME_TEXT_TARGETS: Record<
  CustomThemeBase,
  CustomThemeTextTargets
> = {
  dark: { highlighted: 78, text: 66, toned: 54, muted: 46, dimmed: 36 },
  light: { highlighted: 100, text: 90, toned: 80, muted: 68, dimmed: 50 },
};

/** Насколько ярко должны читаться акцент и цвета состояний (Lc по APCA). */
export const CUSTOM_THEME_ACCENT_TARGET = 60;

/**
 * Дальний предел светлоты акцента на ползунке яркости: на тёмной основе
 * светлее акцент становится почти белым, на светлой темнее — почти чёрным.
 * Ближний предел задаёт контраст: дальше акцент перестаёт читаться.
 */
export const CUSTOM_THEME_ACCENT_LIGHTNESS_LIMIT: Record<
  CustomThemeBase,
  number
> = {
  dark: 0.92,
  light: 0.32,
};

/** Надпись на сплошной кнопке акцента должна читаться не хуже этого (Lc). */
export const CUSTOM_THEME_SOLID_TEXT_TARGET = 60;

/** Тексту достаётся только часть оттенка фона — иначе он кажется грязным. */
export const CUSTOM_THEME_TEXT_TINT_SHARE = 0.6;

/**
 * Прежний вид настроек (основа, яркость, оттенок и насыщенность фона):
 * насыщенность серых при оттенке 100%. Нужна, чтобы перевести старую cookie в
 * цвет фона без смены темы.
 */
export const CUSTOM_THEME_LEGACY_MAX_TINT_CHROMA = 0.02;

/** Цвета состояний: оттенок и насыщенность OKLCH. */
export const CUSTOM_THEME_STATUS_COLORS = {
  error: { hue: 25, chroma: 0.15 },
  success: { hue: 150, chroma: 0.15 },
  info: { hue: 250, chroma: 0.13 },
  warning: { hue: 80, chroma: 0.14 },
} as const;

/** С какой светлоты начинаются цвета состояний до подгонки под контраст. */
export const CUSTOM_THEME_STATUS_START_LIGHTNESS: Record<
  CustomThemeBase,
  number
> = {
  dark: 0.72,
  light: 0.55,
};

/** Если акцент ближе к жёлтому, чем на столько градусов, предупреждение уходит в оранжевый. */
export const CUSTOM_THEME_WARNING_CLASH_DEGREES = 25;

/** Оттенок предупреждения, когда жёлтый занят акцентом. */
export const CUSTOM_THEME_WARNING_FALLBACK_HUE = 55;

/** Ступени шкал цветов, как у Tailwind и Nuxt UI. */
export const CUSTOM_THEME_SCALE_STEPS = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;

/**
 * Ступень, которую Nuxt UI берёт как основной цвет: под классом `.dark` —
 * 400, иначе 500.
 */
export const CUSTOM_THEME_ANCHOR_STEP: Record<CustomThemeBase, number> = {
  dark: 400,
  light: 500,
};

/** Готовые акценты для быстрого выбора. */
export const CUSTOM_THEME_ACCENT_PRESETS = [
  { label: 'Золото', value: '#d7b06c' },
  { label: 'Терракота', value: '#c96442' },
  { label: 'Оранжевый', value: '#f19357' },
  { label: 'Бирюзовый', value: '#4e99a3' },
  { label: 'Синий', value: '#5691c7' },
  { label: 'Фиолетовый', value: '#9b7fd4' },
  { label: 'Зелёный', value: '#5fa86a' },
  { label: 'Красный', value: '#d0565f' },
] as const;
