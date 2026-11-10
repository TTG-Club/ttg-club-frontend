/** Основа своей темы: тёмный или светлый фон. */
export type CustomThemeBase = 'dark' | 'light';

/** Что пользователь выбирает сам — всё остальное считается из этого. */
export interface CustomThemeSettings {
  /** Тёмный или светлый фон */
  base: CustomThemeBase;
  /** Цвет акцента в формате `#rrggbb` */
  accent: string;
  /** Яркость фона внутри основы, 0–100: от самого тёмного до самого светлого */
  backgroundLightness: number;
  /** Оттенок фона по кругу OKLCH, 0–360 */
  backgroundHue: number;
  /** Сколько оттенка подмешать в серые тона, 0–100 */
  backgroundTint: number;
}

/** Готовая палитра своей темы. */
export interface CustomThemePalette {
  /** CSS-переменные темы: имя без `--` → значение */
  variables: Record<string, string>;
  /** Цвет фона страницы — для строки браузера на телефоне */
  pageColor: string;
  /** Итоговый цвет акцента после подгонки под контраст */
  accentColor: string;
  /** Акцент пришлось сделать светлее или темнее, чтобы он читался */
  isAccentAdjusted: boolean;
}

/**
 * Поверхности основы: светлота страницы задаётся ползунком, остальные
 * поверхности — сдвигом от неё по светлоте OKLCH.
 */
export interface CustomThemeSurfaces {
  /** Светлота страницы при яркости фона 0 и 100 */
  pageRange: readonly [number, number];
  /** Сдвиги от страницы */
  card: number;
  elevated: number;
  accented: number;
  borderMuted: number;
  border: number;
  borderAccented: number;
  /** Светлота контрастной плашки — от страницы не зависит */
  inverted: number;
}

/** Пороги контраста APCA (Lc) для уровней текста на фоне страницы. */
export interface CustomThemeTextTargets {
  highlighted: number;
  text: number;
  toned: number;
  muted: number;
  dimmed: number;
}
