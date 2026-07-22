export const DB_NAME = 'dnd5club';

export const THEME_DB_KEY = 'ttg_theme_name';

export const FULLSCREEN_DB_KEY = 'ttg_detail_fullscreen';

export const USER_TOKEN_COOKIE = 'dnd5_user_token';

/**
 * Кука с SSO-токеном auth-service. Ставится всегда (в отличие от
 * `USER_TOKEN_COOKIE`, которая нужна только dev-прокси) и читается сторонними
 * сервисами — например, шлюзом при проксировании в сервис комментариев.
 */
export const SSO_TOKEN_COOKIE = 'ttg-user-token';

export const CONTENT_LAYOUT_FIXED_HEADER_SELECTOR = '.content-layout__fixed';

export default {
  DB_NAME,
  THEME_DB_KEY,
  FULLSCREEN_DB_KEY,
  USER_TOKEN_COOKIE,
};
