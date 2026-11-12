/**
 * Сервис баг-репортов. Браузер к нему напрямую не ходит: сервис не
 * разрешает CORS для этого сайта, поэтому репорт пересылает Nitro.
 */
export const BUG_REPORT_UPSTREAM_URL =
  'https://bug-report.api.ttg.club/api/v1/bugs';

/** Ответ, когда сервис баг-репортов не отвечает. */
export const BUG_REPORT_UNAVAILABLE_STATUS = 502;

/** Заголовки запроса, которые уходят в сервис баг-репортов. */
export const BUG_REPORT_FORWARDED_HEADERS = [
  'authorization',
  'content-type',
] as const;
