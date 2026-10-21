/** Профиль текущего пользователя. */
export const USER_INFO_PATH = '/api/v1/user/info';

/** Вход по логину или почте. */
export const AUTH_SIGN_IN_PATH = '/api/v1/auth/signin';

/**
 * Продление сессии. Refresh-cookie бэкенд ставит только на `/api/v1/auth`,
 * поэтому продлить сессию может лишь браузер, а не SSR-запрос страницы.
 */
export const AUTH_REFRESH_PATH = '/api/v1/auth/refresh';

/** Выход из аккаунта. */
export const AUTH_SIGN_OUT_PATH = '/api/v1/auth/signout';

/** Пункты главного меню. */
export const MENU_PATH = '/api/v1/menu';
