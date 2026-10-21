/**
 * Cookie с выбранной темой. Имя общее со старым SPA на том же домене, чтобы
 * при переходе между частями сайта тема не сбрасывалась.
 */
export const THEME_COOKIE = 'ttg_theme_name';

/** Срок хранения выбранной темы. */
export const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * Access-токен пользователя. Cookie ставит бэкенд с флагом httpOnly, поэтому
 * прочитать его можно только на сервере.
 */
export const USER_TOKEN_COOKIE = 'dnd5_user_token';

/**
 * Видимая из браузера отметка, что пользователь входил на сайт. Её же пишет
 * старое SPA: по ней обе части сайта решают, стоит ли восстанавливать сессию.
 */
export const USER_SESSION_MARKER_COOKIE = 'ttg-user-token';

/** Срок хранения отметки о входе, как в старом SPA. */
export const USER_SESSION_MARKER_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
