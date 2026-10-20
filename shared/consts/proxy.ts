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
