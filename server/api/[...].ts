import { getProxyTarget } from '#shared/utils';

/** Проксирует все запросы `/api/**` во внешние сервисы как есть. */
export default defineEventHandler((event) => {
  const upstreams = getUpstreams();

  return proxyRequest(event, getProxyTarget(event.path, upstreams), {
    headers: getCommentsAuthHeaders(event, upstreams),
  });
});
