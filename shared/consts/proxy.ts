/**
 * Пути subscriber-service (подписки и коды). Без отдельного адреса сервиса
 * уходят в основной API вместе с остальными запросами.
 */
export const SUBSCRIBER_PATH_PREFIXES = ['/api/subscriptions'] as const;

/**
 * Пути сервиса комментариев. Без отдельного адреса сервиса уходят в основной
 * API: бэкенд сам проксирует их в comments-service.
 */
export const COMMENTS_PATH_PREFIXES = ['/api/v1/comments'] as const;

/**
 * Пути core-api — бэкенда нового сайта, откуда берутся новости. Без отдельного
 * адреса сервиса уходят в основной API, где их нет, и блок новостей просто
 * не показывается.
 */
export const CORE_PATH_PREFIXES = ['/api/v2/articles'] as const;
