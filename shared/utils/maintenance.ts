import type { MaintenanceGate, MaintenanceSiteSettings } from '../types';

import { z } from 'zod';

import {
  MAINTENANCE_FILE_PATH_PATTERN,
  MAINTENANCE_HTML_ACCEPT,
  MAINTENANCE_PAGE_METHODS,
  MAINTENANCE_PASSTHROUGH_PREFIXES,
} from '../consts';

/**
 * Схема настройки режима обновления от core-app
 * (`/api/maintenance/sites/5e14`).
 */
export const maintenanceSiteSettingsSchema: z.ZodType<MaintenanceSiteSettings> =
  z.object({
    enabled: z.boolean(),
    title: z.string(),
    message: z.string(),
  });

/** Схема решения о заглушке — для ответа API и контекста запроса. */
export const maintenanceGateSchema: z.ZodType<MaintenanceGate> = z.object({
  blocked: z.boolean(),
  signedIn: z.boolean(),
  title: z.string(),
  message: z.string(),
});

const MAINTENANCE_PAGE_METHOD_SET: ReadonlySet<string> = new Set(
  MAINTENANCE_PAGE_METHODS,
);

/**
 * Открывает ли запрос страницу сайта — только такие режим обновления заменяет
 * заглушкой. API, сборка, файлы и служебные роуты проходят как обычно.
 *
 * @param method - Метод запроса
 * @param pathname - Путь запроса без query-строки
 * @param accept - Заголовок `Accept`; пустая строка — его нет
 * @returns `true`, если это страница
 */
export function isMaintenancePageRequest(
  method: string,
  pathname: string,
  accept: string,
): boolean {
  if (!MAINTENANCE_PAGE_METHOD_SET.has(method)) {
    return false;
  }

  if (
    MAINTENANCE_PASSTHROUGH_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix),
    )
  ) {
    return false;
  }

  // Адрес с расширением — обычно файл (robots.txt, sitemap.xml). Но если
  // браузер открывает его как страницу, это страница.
  if (MAINTENANCE_FILE_PATH_PATTERN.test(pathname)) {
    return accept.includes(MAINTENANCE_HTML_ACCEPT);
  }

  return true;
}
