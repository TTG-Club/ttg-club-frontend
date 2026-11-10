/**
 * Режимы темы в cookie. `dark`, `light` и `auto` пишет и старое SPA;
 * `svifty7` и `custom` — темы, перенесённые с new.ttg.club.
 */
export const THEME_MODES = [
  'light',
  'dark',
  'svifty7',
  'custom',
  'auto',
] as const;

export type ThemeMode = (typeof THEME_MODES)[number];
