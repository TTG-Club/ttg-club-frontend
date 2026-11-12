import {
  BUG_REPORT_FORWARDED_HEADERS,
  BUG_REPORT_UNAVAILABLE_STATUS,
  BUG_REPORT_UPSTREAM_URL,
} from '#server/consts';

/**
 * Пересылает баг-репорт в сервис баг-репортов. Сервис отклоняет запросы с
 * чужим `Origin`, поэтому уходят только тело и нужные заголовки, без
 * `Origin` и cookie сайта. Ответ сервиса возвращается как есть.
 */
export default defineEventHandler(async (event) => {
  const headers: Record<string, string> = {};

  for (const name of BUG_REPORT_FORWARDED_HEADERS) {
    const value = getRequestHeader(event, name);

    if (value) {
      headers[name] = value;
    }
  }

  const body = await readRawBody(event, false);

  const response = await fetch(BUG_REPORT_UPSTREAM_URL, {
    method: 'POST',
    headers,
    body: body ? new Uint8Array(body) : undefined,
  }).catch(() => {
    throw createError({
      statusCode: BUG_REPORT_UNAVAILABLE_STATUS,
      statusMessage: 'Bug report service is unavailable',
    });
  });

  setResponseStatus(event, response.status, response.statusText);

  const contentType = response.headers.get('content-type');

  if (contentType) {
    setResponseHeader(event, 'content-type', contentType);
  }

  return response.text();
});
