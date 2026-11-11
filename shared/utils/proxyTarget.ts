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

/**
 * Проверяет, что запрос уходит напрямую в сервис, который принимает токен
 * только как `Bearer`: subscriber-service или comments-service с заданным
 * адресом.
 *
 * @param path - Путь запроса вместе с query-строкой
 * @param upstreams - Адреса сервисов
 * @returns `true`, если запрос идёт в такой сервис напрямую
 */
function isBearerOnlyService(path: string, upstreams: ProxyUpstreams): boolean {
  return (
    (!!upstreams.subscriber && isPathWithPrefix(path, SUBSCRIBER_PATH_PREFIXES))
    || (!!upstreams.comments && isPathWithPrefix(path, COMMENTS_PATH_PREFIXES))
  );
}

/**
 * Возвращает значение заголовка `Authorization` для subscriber-service и
 * comments-service.
 *
 * Сервисы принимают токен только как `Bearer`, а сайт держит его в
 * httpOnly-cookie. Без отдельного адреса сервиса запрос уходит в основной API,
 * и бэкенд перекладывает cookie сам; уже заданный заголовок не трогается.
 *
 * @param path - Путь запроса вместе с query-строкой
 * @param upstreams - Адреса сервисов
 * @param authorization - Заголовок `Authorization` входящего запроса
 * @param token - Access-токен из cookie
 * @returns Значение заголовка либо `undefined`, если добавлять его не нужно
 */
export function getServiceAuthorization(
  path: string,
  upstreams: ProxyUpstreams,
  authorization: string | undefined,
  token: string | undefined,
): string | undefined {
  if (!token || authorization || !isBearerOnlyService(path, upstreams)) {
    return undefined;
  }

  return `Bearer ${token}`;
}
