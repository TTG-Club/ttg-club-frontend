import type { MaintenanceGate, MaintenanceSiteSettings } from '../types';

/**
 * Общий контракт режима «сайт закрыт на обновление»: умолчания и роуты. Нужен
 * и серверу (решение о заглушке), и браузеру (заглушка, сверка при переходах).
 * Тексты по умолчанию — те же, что у сайта D&D 2024.
 */

/** Роут сайта: показывать ли заглушку текущему посетителю. */
export const MAINTENANCE_API_PATH = '/api/maintenance';

export const MAINTENANCE_DEFAULT_TITLE =
  'Таверна закрыта: мы восстаём из пепла';

export const MAINTENANCE_DEFAULT_MESSAGE =
  'Нашу цитадель постигла беда, но жрецы уже читают «Истинное воскрешение». Мы переезжаем на новые земли, укрепляем стены и заново наполняем библиотеку.\n\nРитуал займёт немного времени — загляни позже, путник. Да не подведут тебя кости!';

/**
 * Настройка, пока её не удалось получить от core-app: режим ВКЛЮЧЁН. Явное
 * «выключено» бывает только сохранённым из админки.
 */
export const MAINTENANCE_DEFAULT_SITE_SETTINGS: MaintenanceSiteSettings = {
  enabled: true,
  title: MAINTENANCE_DEFAULT_TITLE,
  message: MAINTENANCE_DEFAULT_MESSAGE,
};

/** Сайт открыт: заглушки нет. */
export const MAINTENANCE_OPEN_GATE: MaintenanceGate = {
  blocked: false,
  signedIn: false,
  title: '',
  message: '',
};

/**
 * Поле контекста запроса, где серверный middleware оставляет решение о
 * заглушке: его читают рендер страницы и плагин статуса ответа.
 */
export const MAINTENANCE_CONTEXT_KEY = 'maintenanceGate';

/**
 * Начала адресов, которые режим обновления не трогает: API (в нём и вход, и
 * сверка режима), сборка и острова Nuxt. Иначе у администратора не заработал
 * бы ни вход, ни сам сайт. Внутренний `/__nuxt_error` здесь не указан
 * намеренно: это рендер страницы ошибки, и при закрытом сайте он тоже должен
 * стать заглушкой.
 */
export const MAINTENANCE_PASSTHROUGH_PREFIXES = [
  '/api/',
  '/_nuxt/',
  '/__nuxt_island',
] as const;

/** Методы, которыми открывают страницы. */
export const MAINTENANCE_PAGE_METHODS = ['GET', 'HEAD'] as const;

/** Последний кусок адреса с расширением — это файл, а не страница. */
export const MAINTENANCE_FILE_PATH_PATTERN = /\.[a-z0-9]+$/i;

/** Тип ответа, который просит браузер, открывая страницу. */
export const MAINTENANCE_HTML_ACCEPT = 'text/html';
