/**
 * Cookie с выбранной темой. Имя общее со старым SPA на том же домене, чтобы
 * при переходе между частями сайта тема не сбрасывалась.
 */
export const THEME_COOKIE = 'ttg_theme_name';

/** Срок хранения выбранной темы. */
export const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
