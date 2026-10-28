import { getProxyTarget } from '#shared/utils';

/** Карту сайта по-прежнему собирает бэкенд — отдаём её как есть. */
export default defineEventHandler((event) =>
  proxyRequest(event, getProxyTarget(event.path, getUpstreams())),
);
