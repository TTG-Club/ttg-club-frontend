/** Режимы темы, которые старое SPA пишет в cookie. */
export const THEME_MODES = ['dark', 'light', 'auto'] as const;

export type ThemeMode = (typeof THEME_MODES)[number];
