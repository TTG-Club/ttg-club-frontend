import { getProxyTarget } from '#shared/utils';

/** Методы, которыми картинки читают; остальное сюда не пускаем. */
const READ_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD']);

/**
 * Картинки сайта: `/s3/5e14/<путь>` раздаёт бэкенд из S3, как новый сайт.
 * Nitro проксирует их как есть, путь сохраняется.
 */
export default defineEventHandler((event) => {
  if (!READ_METHODS.has(event.method)) {
    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' });
  }

  return proxyRequest(event, getProxyTarget(event.path, getUpstreams()));
});
