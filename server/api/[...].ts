import { getProxyTarget } from '#shared/utils';

/** Проксирует все запросы `/api/**` во внешние сервисы как есть. */
export default defineEventHandler((event) =>
  proxyRequest(event, getProxyTarget(event.path, getUpstreams())),
);
