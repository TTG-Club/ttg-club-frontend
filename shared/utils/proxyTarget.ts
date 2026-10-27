import {
  COMMENTS_PATH_PREFIXES,
  CORE_PATH_PREFIXES,
  SUBSCRIBER_PATH_PREFIXES,
} from '../consts';

/** Адреса внешних сервисов, в которые Nitro проксирует `/api/**`. */
export interface ProxyUpstreams {
  /** Основной API (бэкенд справочника или шлюз перед ним). */
  api: string;
  /** subscriber-service; пустая строка — запросы идут в основной API. */
  subscriber: string;
  /** comments-service; пустая строка — запросы идут в основной API. */
  comments: string;
  /** core-api нового сайта; пустая строка — запросы идут в основной API. */
  core: string;
}

/**
 * Проверяет, что путь начинается с одного из префиксов.
 *
 * Совпадение строгое по сегменту: `/api/foo` и `/api/foo/...`, но не
 * `/api/foo-bar`. Query-строка перед сравнением отбрасывается.
 *
 * @param path - Путь запроса, может содержать query-строку
 * @param prefixes - Префиксы путей без завершающего слэша
 * @returns `true`, если путь относится к одному из префиксов
 */
export function isPathWithPrefix(
  path: string,
  prefixes: readonly string[],
): boolean {
  const [pathname = path] = path.split('?');

  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Убирает завершающие слэши у базового адреса сервиса.
 *
 * @param url - Базовый адрес
 * @returns Адрес без завершающих слэшей
 */
function trimTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Возвращает полный адрес, на который нужно проксировать запрос.
 *
 * Подписки, комментарии и новости уходят в свои сервисы, если их адреса заданы,
 * остальное — в основной API. Путь запроса сохраняется как есть.
 *
 * @param path - Путь запроса вместе с query-строкой
 * @param upstreams - Адреса сервисов
 * @returns Полный адрес для проксирования
 */
export function getProxyTarget(
  path: string,
  upstreams: ProxyUpstreams,
): string {
  if (
    upstreams.subscriber
    && isPathWithPrefix(path, SUBSCRIBER_PATH_PREFIXES)
  ) {
    return trimTrailingSlashes(upstreams.subscriber) + path;
  }

  if (upstreams.comments && isPathWithPrefix(path, COMMENTS_PATH_PREFIXES)) {
    return trimTrailingSlashes(upstreams.comments) + path;
  }

  if (upstreams.core && isPathWithPrefix(path, CORE_PATH_PREFIXES)) {
    return trimTrailingSlashes(upstreams.core) + path;
  }

  return trimTrailingSlashes(upstreams.api) + path;
}
