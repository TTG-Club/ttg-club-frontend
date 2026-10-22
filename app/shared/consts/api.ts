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

/** Регистрация. */
export const AUTH_SIGN_UP_PATH = '/api/v1/auth/signup';

/** Проверка, свободны ли имя пользователя или почта: занято — 409. */
export const AUTH_EXIST_PATH = '/api/v1/auth/exist';

/** Подтверждение почты по ссылке из письма. */
export const AUTH_VERIFY_EMAIL_PATH = '/api/v1/auth/verify-email';

/** Письмо со ссылкой на сброс пароля: сервис авторизации, без версии. */
export const PASSWORD_RESET_REQUEST_PATH =
  '/api/account/password/reset-request';

/** Проверка ссылки сброса: годная — 204, просроченная — 400 с `message`. */
export const PASSWORD_RESET_VALIDATE_PATH =
  '/api/account/password/reset-token/validate';

/** Новый пароль по ссылке сброса. */
export const PASSWORD_RESET_CONFIRM_PATH =
  '/api/account/password/reset-confirm';
