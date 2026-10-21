/** Адрес скрипта Яндекс.Метрики */
export const YANDEX_METRIKA_SCRIPT_URL = 'https://mc.yandex.ru/metrika/tag.js';

/** Ключ скрипта Яндекс.Метрики: по нему скрипт не подключается дважды */
export const YANDEX_METRIKA_SCRIPT_KEY = 'yandex-metrika';

/** Метод Метрики, запускающий счётчик */
export const YANDEX_METRIKA_INIT_METHOD = 'init';

/** Метод Метрики, отправляющий просмотр страницы */
export const YANDEX_METRIKA_HIT_METHOD = 'hit';

/** Метод остановки счётчика при завершении работы приложения. */
export const YANDEX_METRIKA_DESTRUCT_METHOD = 'destruct';

/**
 * Параметр адреса скрипта Google Analytics с идентификатором счётчика —
 * так адрес собирает и сам модуль `nuxt-gtag`.
 */
export const GOOGLE_ANALYTICS_ID_QUERY_PARAMETER = 'id';

/**
 * Атрибут скрипта Google Analytics. По нему `useGtag().initialize()` модуля
 * `nuxt-gtag` понимает, что скрипт уже подключён, и не вставляет второй.
 */
export const GOOGLE_ANALYTICS_SCRIPT_MARKER = 'data-gtag';

/**
 * Настройки счётчика — те же, что у старого SPA, чтобы статистика 5e14 после
 * переезда считалась как раньше. Первый просмотр счётчик отправляет сам.
 */
export const YANDEX_METRIKA_INIT_OPTIONS = {
  accurateTrackBounce: true,
  clickmap: true,
  trackHash: true,
  trackLinks: true,
  webvisor: true,
};
