/**
 * Режимы темы в cookie. `svifty7` и `custom` — темы, перенесённые с
 * new.ttg.club.
 */
export const THEME_MODES = ['light', 'dark', 'svifty7', 'custom'] as const;

export type ThemeMode = (typeof THEME_MODES)[number];

/** Тема по умолчанию — и для cookie с неизвестным или устаревшим значением. */
export const DEFAULT_THEME_MODE: ThemeMode = 'dark';
