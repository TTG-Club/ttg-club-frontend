import type { ProxyUpstreams } from '#shared/utils';
import type { H3Event } from 'h3';

import { COMMENTS_PATH_PREFIXES, USER_TOKEN_COOKIE } from '#shared/consts';
import { isPathWithPrefix } from '#shared/utils';

/**
 * Заголовок авторизации для comments-service.
 *
 * Сервис принимает только `Authorization: Bearer`, а токен лежит в
 * httpOnly-cookie. Без отдельного адреса сервиса запрос идёт через бэкенд,
 * и тот перекладывает cookie сам; при прямом проксировании это делает Nitro.
 *
 * @param event - Входящий запрос
 * @param upstreams - Адреса сервисов
 * @returns Заголовок `Authorization` либо пустой объект
 */
export function getCommentsAuthHeaders(
  event: H3Event,
  upstreams: ProxyUpstreams,
): Record<string, string> {
  if (
    !upstreams.comments
    || !isPathWithPrefix(event.path, COMMENTS_PATH_PREFIXES)
    || getRequestHeader(event, 'authorization')
  ) {
    return {};
  }

  const token = getCookie(event, USER_TOKEN_COOKIE);

  return token ? { authorization: `Bearer ${token}` } : {};
}
