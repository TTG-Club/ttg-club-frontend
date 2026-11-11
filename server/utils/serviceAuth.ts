import type { ProxyUpstreams } from '#shared/utils';
import type { H3Event } from 'h3';

import { USER_TOKEN_COOKIE } from '#shared/consts';
import { getServiceAuthorization } from '#shared/utils';

/**
 * Заголовки авторизации для прямого проксирования в subscriber-service и
 * comments-service:
 * токен из httpOnly-cookie уходит как `Authorization: Bearer`.
 *
 * @param event - Входящий запрос
 * @param upstreams - Адреса сервисов
 * @returns Заголовок `Authorization` либо пустой объект
 */
export function getServiceAuthHeaders(
  event: H3Event,
  upstreams: ProxyUpstreams,
): Record<string, string> {
  const authorization = getServiceAuthorization(
    event.path,
    upstreams,
    getRequestHeader(event, 'authorization'),
    getCookie(event, USER_TOKEN_COOKIE),
  );

  return authorization ? { authorization } : {};
}
