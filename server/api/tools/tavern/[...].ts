import { getProxyTarget } from '#shared/utils';

/** Префикс, который Nitro добавляет к ручкам таверны. */
const API_PREFIX = /^\/api/;

/**
 * Генератор таверны живёт на бэкенде вне `/api` (`/tools/tavern/*`) и отдаёт
 * HTML. Nitro проксирует его под `/api/tools/tavern/*`, чтобы адрес не
 * пересекался со страницей `/tools/tavern`.
 */
export default defineEventHandler((event) =>
  proxyRequest(
    event,
    getProxyTarget(event.path.replace(API_PREFIX, ''), getUpstreams()),
  ),
);
