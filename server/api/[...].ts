import {
  CATALOG_BODY_READ_METHOD,
  clearCatalogCache,
  getCatalogCacheKey,
  isCatalogCacheBypassed,
  isCatalogCacheReset,
  isCatalogRead,
  isCatalogRequestAccepted,
  sendCatalogResponse,
} from '#server/domain/catalog-cache';
import { getProxyTarget } from '#shared/utils';

/**
 * Проксирует все запросы `/api/**` во внешние сервисы как есть.
 *
 * Чтение каталога (заклинания, бестиарий, предметы и так далее) гостям
 * отдаётся из кэша на сервере сайта. Вошедшие (среди них редакторы
 * мастерской) идут мимо кэша и всегда видят свежие данные. Любая запись в
 * мастерской сбрасывает кэш, поэтому правка редактора видна гостям сразу.
 */
export default defineEventHandler(async (event) => {
  const upstreams = getUpstreams();
  const target = getProxyTarget(event.path, upstreams);

  if (
    isCatalogRead(event.method, event.path)
    && !isCatalogCacheBypassed(event)
  ) {
    // Тело есть только у чтения через POST: на попытку прочитать тело GET
    // h3 отвечает 405.
    const body =
      event.method === CATALOG_BODY_READ_METHOD
        ? await readRawBody(event)
        : undefined;

    const cacheKey = getCatalogCacheKey(event.method, event.path, body);

    if (cacheKey) {
      return sendCatalogResponse(event, { cacheKey, target, body });
    }
  }

  const proxyResponse = await proxyRequest(event, target, {
    headers: getServiceAuthHeaders(event, upstreams),
  });

  if (
    isCatalogCacheReset(event.method, event.path)
    && isCatalogRequestAccepted(event)
  ) {
    await clearCatalogCache();
  }

  return proxyResponse;
});
