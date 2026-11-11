import {
  SESSION_EXPIRED_STATUS,
  SESSION_REFRESH_EXCLUDED_PREFIXES,
} from '../consts';
import { isPathWithPrefix } from './proxyTarget';

/** Основа для разбора относительных адресов запросов. */
const RELATIVE_URL_BASE = 'http://localhost';

/**
 * Возвращает путь запроса без адреса сайта.
 *
 * @param request - Адрес запроса или сам запрос
 * @returns Путь вместе с query-строкой
 */
function getRequestPath(request: string | Request): string {
  const url = new URL(
    typeof request === 'string' ? request : request.url,
    RELATIVE_URL_BASE,
  );

  return url.pathname + url.search;
}

/**
 * Проверяет, что на ответ стоит продлить сессию и повторить запрос.
 *
 * Продлевают только при истёкшем токене (401) и никогда — для запросов
 * входа, продления и смены пароля: они отвечают 401 на неверные данные.
 *
 * @param request - Адрес запроса или сам запрос
 * @param status - Код ответа
 * @returns `true`, если нужно продлить сессию
 */
export function shouldRefreshSession(
  request: string | Request,
  status: number,
): boolean {
  return (
    status === SESSION_EXPIRED_STATUS
    && !isPathWithPrefix(
      getRequestPath(request),
      SESSION_REFRESH_EXCLUDED_PREFIXES,
    )
  );
}
