import type { MaintenanceGate, MaintenanceSiteSettings } from '#shared/types';
import type { H3Event } from 'h3';

import { consola } from 'consola';

import {
  MAINTENANCE_PROFILE_TIMEOUT_MS,
  MAINTENANCE_SETTINGS_CACHE_MAX_AGE_SECONDS,
  MAINTENANCE_SETTINGS_FAILURE_BACKOFF_MS,
  MAINTENANCE_SETTINGS_READ_FAILED_LOG,
  MAINTENANCE_SETTINGS_TIMEOUT_MS,
  MAINTENANCE_SETTINGS_URL_MISSING_ERROR,
} from '#server/consts';
import {
  MAINTENANCE_DEFAULT_SITE_SETTINGS,
  MAINTENANCE_OPEN_GATE,
  USER_INFO_PATH,
  USER_TOKEN_COOKIE,
} from '#shared/consts';
import { Role, userProfileSchema } from '#shared/types';
import { maintenanceSiteSettingsSchema } from '#shared/utils';

/** Имя и ключ кешированной функции чтения настройки. */
const SETTINGS_CACHE_NAME = 'maintenance';
const SETTINGS_CACHE_KEY = 'settings';

/**
 * До какого момента (мс) не спрашивать core-app после сбоя. Общее на процесс
 * состояние, без данных посетителя.
 */
let readFailureBackoffUntil = 0;

/**
 * Читает настройку режима у core-app, мимо кеша. Адрес — переменная
 * `NITRO_MAINTENANCE_SETTINGS_URL` (на сервере — внутренний адрес core-app,
 * `.../api/maintenance/sites/5e14`). Нет адреса, сбой сети или чужой формат
 * ответа — ошибка: решать, что с ней делать, должен вызывающий.
 *
 * @returns настройка режима этого сайта
 */
async function fetchMaintenanceSettings(): Promise<MaintenanceSiteSettings> {
  const { NITRO_MAINTENANCE_SETTINGS_URL: settingsUrl = '' } = process.env;

  if (!settingsUrl) {
    throw new Error(MAINTENANCE_SETTINGS_URL_MISSING_ERROR);
  }

  const response: unknown = await $fetch(settingsUrl, {
    timeout: MAINTENANCE_SETTINGS_TIMEOUT_MS,
    retry: 0,
  });

  return maintenanceSiteSettingsSchema.parse(response);
}

/**
 * Настройка с кешем Nitro. В режиме stale-while-revalidate сбой core-app при
 * обновлении оставляет последнее полученное значение.
 */
const getCachedMaintenanceSettings = defineCachedFunction(
  fetchMaintenanceSettings,
  {
    name: SETTINGS_CACHE_NAME,
    getKey: () => SETTINGS_CACHE_KEY,
    maxAge: MAINTENANCE_SETTINGS_CACHE_MAX_AGE_SECONDS,
  },
);

/**
 * Настройка режима «сайт закрыт на обновление» для решения о заглушке; её
 * читает каждый заход на страницу. Никогда не падает: если адрес не задан,
 * core-app недоступен и полученного значения нет, сайт считается закрытым —
 * так же, как сайт D&D 2024 без своего хранилища; администраторы всё равно
 * войдут. После сбоя core-app какое-то время не спрашивается вовсе.
 *
 * @returns настройка режима этого сайта
 */
export async function getMaintenanceSettings(): Promise<MaintenanceSiteSettings> {
  if (Date.now() < readFailureBackoffUntil) {
    return MAINTENANCE_DEFAULT_SITE_SETTINGS;
  }

  try {
    return await getCachedMaintenanceSettings();
  } catch (error) {
    consola.error(MAINTENANCE_SETTINGS_READ_FAILED_LOG, error);

    readFailureBackoffUntil =
      Date.now() + MAINTENANCE_SETTINGS_FAILURE_BACKOFF_MS;

    return MAINTENANCE_DEFAULT_SITE_SETTINGS;
  }
}

/**
 * Роли посетителя. Сессию держит бэкенд в httpOnly-cookie, и подпись токена
 * знает только он, поэтому роли берутся из профиля: запрос уходит через
 * прокси `/api/**` с cookie посетителя.
 *
 * @param event - Событие H3
 * @returns роли; `null` — посетитель не вошёл или сессия истекла
 */
async function getVisitorRoles(event: H3Event): Promise<string[] | null> {
  if (!getCookie(event, USER_TOKEN_COOKIE)) {
    return null;
  }

  try {
    const response: unknown = await event.$fetch(USER_INFO_PATH, {
      timeout: MAINTENANCE_PROFILE_TIMEOUT_MS,
      retry: 0,
    });

    return userProfileSchema.parse(response).roles;
  } catch {
    return null;
  }
}

/**
 * Решает, показывать ли посетителю заглушку: при включённом режиме сайт
 * открыт только администраторам.
 *
 * @param event - Событие H3
 * @param settings - Настройка режима этого сайта
 * @returns решение о заглушке
 */
export async function resolveMaintenanceGate(
  event: H3Event,
  settings: MaintenanceSiteSettings,
): Promise<MaintenanceGate> {
  if (!settings.enabled) {
    return MAINTENANCE_OPEN_GATE;
  }

  const roles = await getVisitorRoles(event);

  if (roles?.includes(Role.ADMIN)) {
    return MAINTENANCE_OPEN_GATE;
  }

  return {
    blocked: true,
    signedIn: roles !== null,
    title: settings.title,
    message: settings.message,
  };
}
