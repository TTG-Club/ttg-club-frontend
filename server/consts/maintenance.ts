import ms from 'ms';

/**
 * Серверная часть режима «сайт закрыт на обновление»: ответ заглушки и
 * чтение настройки у core-app.
 */

/** Ответ заглушки: «сервис временно недоступен». */
export const MAINTENANCE_STATUS_CODE = 503;

export const MAINTENANCE_STATUS_MESSAGE = 'Service Unavailable';

/** Через сколько секунд стоит зайти снова (заголовок `Retry-After`). */
export const MAINTENANCE_RETRY_AFTER_SECONDS = ms('1h') / 1000;

/**
 * Пока режим включён, страницы не кешируются нигде: иначе заглушка могла бы
 * достаться администратору из кеша, а открытая страница — посетителю.
 */
export const MAINTENANCE_CACHE_CONTROL = 'no-store';

/** Заглушка не должна попасть в поиск. */
export const MAINTENANCE_ROBOTS_TAG = 'noindex, nofollow';

export const MAINTENANCE_CACHE_CONTROL_HEADER = 'cache-control';

export const MAINTENANCE_RETRY_AFTER_HEADER = 'retry-after';

export const MAINTENANCE_ROBOTS_HEADER = 'x-robots-tag';

/**
 * Сколько Nitro держит настройку (сек). Её читает каждый заход на любую
 * страницу; срок ограничивает, как быстро до сайта доходит включение и
 * выключение режима в админке core-app.
 */
export const MAINTENANCE_SETTINGS_CACHE_MAX_AGE_SECONDS = ms('1m') / 1000;

/**
 * Сколько после сбоя не спрашивать core-app снова, мс. Иначе каждый заход на
 * страницу ждал бы таймаута, пока core-app лежит, — а так сайт сразу
 * считается закрытым.
 */
export const MAINTENANCE_SETTINGS_FAILURE_BACKOFF_MS = ms('30s');

/** Сколько ждать ответа core-app с настройкой, мс. */
export const MAINTENANCE_SETTINGS_TIMEOUT_MS = ms('3s');

/** Сколько ждать профиль посетителя от бэкенда, мс. */
export const MAINTENANCE_PROFILE_TIMEOUT_MS = ms('5s');

/** Адрес настройки не задан — сайт считается закрытым. */
export const MAINTENANCE_SETTINGS_URL_MISSING_ERROR =
  'NITRO_MAINTENANCE_SETTINGS_URL is not set';

/** core-app не ответил или ответил не тем — сайт считается закрытым. */
export const MAINTENANCE_SETTINGS_READ_FAILED_LOG =
  '[Maintenance] Settings are unavailable, the site is treated as closed:';
