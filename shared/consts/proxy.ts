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
 * Пути core-api — бэкенда нового сайта, откуда берутся новости сайта и
 * новости сообщества. Без отдельного адреса сервиса уходят в основной API, где
 * их нет, и блоки новостей показывают заглушку.
 */
export const CORE_PATH_PREFIXES = [
  '/api/v2/articles',
  '/api/v2/community-news',
] as const;
