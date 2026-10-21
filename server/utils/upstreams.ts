import type { ProxyUpstreams } from '#shared/utils';

/**
 * Читает адреса внешних сервисов из окружения.
 *
 * Фронт не знает, где живёт API, до запуска: адрес задаётся переменной
 * `NITRO_API_URL` контейнера, поэтому один и тот же образ работает и на dev,
 * и на проде.
 *
 * @returns Адреса сервисов для проксирования
 */
export function getUpstreams(): ProxyUpstreams {
  const {
    NITRO_API_URL: api = '',
    NITRO_SUBSCRIBER_API_URL: subscriber = '',
    NITRO_COMMENTS_API_URL: comments = '',
  } = process.env;

  if (!api) {
    throw createError({
      statusCode: 503,
      statusMessage: 'NITRO_API_URL is not set',
    });
  }

  return { api, subscriber, comments };
}
