import { createHash } from 'node:crypto';

import {
  CATALOG_API_PREFIX,
  CATALOG_BODY_READ_METHOD,
  CATALOG_CACHE_RESET_SECTIONS,
  CATALOG_CACHE_SECTIONS,
  CATALOG_READ_METHODS,
  CATALOG_READ_ONLY_ACTION_SEGMENTS,
  CATALOG_SAFE_METHODS,
} from '../model/constants';

/** Адрес запроса, разобранный на части, важные для кэша. */
interface CatalogPath {
  /** Раздел бэкенда: первый кусок адреса после `/api/v1/`. */
  section: string;
  /** Последний кусок адреса. */
  lastSegment: string;
  /** Адрес без параметров. */
  pathname: string;
  /** Параметры запроса в постоянном порядке. */
  search: string;
}

/**
 * Разбирает адрес запроса. Параметры сортируются, чтобы один и тот же запрос
 * с разным порядком параметров попадал в одну запись кэша.
 *
 * @param path Адрес запроса вместе с параметрами.
 */
function parseCatalogPath(path: string): CatalogPath | undefined {
  const [pathname = '', query = ''] = path.split('?');

  if (!pathname.startsWith(CATALOG_API_PREFIX)) {
    return undefined;
  }

  const segments = pathname
    .slice(CATALOG_API_PREFIX.length)
    .split('/')
    .filter(Boolean);

  const section = segments.at(0);
  const lastSegment = segments.at(-1);

  if (!section || !lastSegment) {
    return undefined;
  }

  const searchParams = new URLSearchParams(query);

  searchParams.sort();

  return {
    section,
    lastSegment,
    pathname,
    search: searchParams.toString(),
  };
}

/**
 * Читает ли запрос каталог, то есть можно ли отдать на него общий ответ из
 * кэша. Это чтение разделов каталога, кроме предпросмотра.
 *
 * @param method Метод запроса.
 * @param path Адрес запроса вместе с параметрами.
 */
export function isCatalogRead(method: string, path: string): boolean {
  if (!CATALOG_READ_METHODS.includes(method)) {
    return false;
  }

  const catalogPath = parseCatalogPath(path);

  return Boolean(
    catalogPath
    && CATALOG_CACHE_SECTIONS.includes(catalogPath.section)
    && !CATALOG_READ_ONLY_ACTION_SEGMENTS.includes(catalogPath.lastSegment),
  );
}

/**
 * Ключ записи кэша для запроса или `undefined`, если такой запрос не
 * кэшируется.
 *
 * Бэкенд читает каталог по POST с параметрами в теле (страница, поиск,
 * фильтры), поэтому в ключ входят метод и хэш тела: разные тела — разные
 * записи.
 *
 * Ключ закодирован целиком (`encodeURIComponent`): хранилище Nitro (unstorage)
 * нормализует ключ, отрезая всё после `?` и заменяя `/` на `:`. Без кодирования
 * все запросы к одному адресу с разными параметрами попадали бы в одну запись,
 * и гость получал ответ на чужой запрос.
 *
 * @param method Метод запроса.
 * @param path Адрес запроса вместе с параметрами.
 * @param body Тело запроса как есть.
 */
export function getCatalogCacheKey(
  method: string,
  path: string,
  body?: string,
): string | undefined {
  if (!isCatalogRead(method, path)) {
    return undefined;
  }

  const catalogPath = parseCatalogPath(path);

  if (!catalogPath) {
    return undefined;
  }

  const requestPath = catalogPath.search
    ? `${catalogPath.pathname}?${catalogPath.search}`
    : catalogPath.pathname;

  const requestKey = encodeURIComponent(`${method} ${requestPath}`);

  if (method !== CATALOG_BODY_READ_METHOD || !body) {
    return requestKey;
  }

  return `${requestKey}.${createHash('sha256').update(body).digest('hex')}`;
}

/**
 * Меняет ли запрос каталог, то есть нужно ли после него сбросить кэш. Это
 * любая запись в мастерской (создание, правка, откат, картинки), заливка из
 * JSON и запись в раздел каталога методом, которым его не читают.
 *
 * @param method Метод запроса.
 * @param path Адрес запроса вместе с параметрами.
 */
export function isCatalogCacheReset(method: string, path: string): boolean {
  if (CATALOG_SAFE_METHODS.includes(method)) {
    return false;
  }

  const catalogPath = parseCatalogPath(path);

  if (!catalogPath) {
    return false;
  }

  if (CATALOG_READ_ONLY_ACTION_SEGMENTS.includes(catalogPath.lastSegment)) {
    return false;
  }

  if (CATALOG_CACHE_RESET_SECTIONS.includes(catalogPath.section)) {
    return true;
  }

  return (
    CATALOG_CACHE_SECTIONS.includes(catalogPath.section)
    && !CATALOG_READ_METHODS.includes(method)
  );
}
