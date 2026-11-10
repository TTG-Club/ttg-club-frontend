/** Основа своей темы: тёмный или светлый фон. */
export type CustomThemeBase = 'dark' | 'light';

/**
 * Что пользователь выбирает сам — всё остальное считается из этого. Основа
 * (тёмная или светлая) не хранится: она следует из светлоты фона.
 */
export interface CustomThemeSettings {
  /** Цвет фона страницы в формате `#rrggbb` */
  background: string;
  /** Цвет акцента в формате `#rrggbb` */
  accent: string;
}

/** Готовая палитра своей темы. */
export interface CustomThemePalette {
  /** Основа, которая получилась из цвета фона */
  base: CustomThemeBase;
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
 * Поверхности основы: светлота страницы берётся из цвета фона (в пределах
 * основы), остальные поверхности — сдвигом от неё по светлоте OKLCH.
 */
export interface CustomThemeSurfaces {
  /** Пределы светлоты страницы: яркость фона 0 и 100 */
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
