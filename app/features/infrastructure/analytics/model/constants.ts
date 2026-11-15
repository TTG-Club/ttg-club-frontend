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

/** Как часто вкладка отмечает посетителя онлайн: раз в 30 секунд. */
export const ONLINE_HEARTBEAT_INTERVAL_MS = 30_000;

/**
 * Пауза между отметками при частых возвратах на вкладку, чтобы серия
 * переключений не дала пачку запросов.
 */
export const ONLINE_HEARTBEAT_COOLDOWN_MS = 10_000;

/**
 * Блокировка, по которой отмечает только одна вкладка сайта, остальные ждут.
 * Имя общее со старым SPA.
 */
export const ONLINE_HEARTBEAT_LOCK_NAME = 'ttg-online-heartbeat-leader';

/** Тип посетителя для сервиса онлайна. */
export const ONLINE_VISITOR_TYPE = {
  guest: 'GUEST',
  registered: 'REGISTERED',
} as const;

/** Длина ключа посетителя, которую принимает сервис онлайна. */
export const ONLINE_VISITOR_KEY_MAX_LENGTH = 128;

/** Как часто проверяется, работает ли посетитель с инструментом, — раз в 15 секунд */
export const FEATURE_USAGE_SAMPLE_SECONDS = 15;

/** Тот же шаг проверки в миллисекундах — для таймера */
export const FEATURE_USAGE_SAMPLE_MS = FEATURE_USAGE_SAMPLE_SECONDS * 1000;

/** Сколько секунд работы копится до отправки отметки — минута */
export const FEATURE_USAGE_REPORT_SECONDS = 60;

/**
 * Сколько после последнего действия посетитель считается работающим — 15 минут.
 * Мастер подолгу читает запись, не трогая страницу, но забытая на экране вкладка
 * время не накручивает.
 */
export const FEATURE_USAGE_IDLE_MS = 15 * 60 * 1000;

/** Действия посетителя, по которым видно, что с инструментом работают */
export const FEATURE_USAGE_ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'pointerdown',
  'keydown',
  'wheel',
];

/** Отметка «инструмент открыт»: времени работы в ней ещё нет */
export const FEATURE_USAGE_OPENED_SECONDS = 0;

/**
 * Сколько отметка ждёт восстановления сессии, чтобы вошедший не ушёл в учёт
 * гостем, — 5 секунд. Не дождалась — сессию продлить не удалось.
 */
export const FEATURE_USAGE_SESSION_WAIT_MS = 5000;

/** С этого кода ответа сервис учёта считается отказавшим: отметки прекращаются */
export const FEATURE_USAGE_REJECTED_MIN_STATUS = 400;

/** С этого кода ответа сбой считается временным: отметки продолжаются */
export const FEATURE_USAGE_SERVER_ERROR_MIN_STATUS = 500;

/** Превышение лимита запросов — тоже временное, отметки продолжаются */
export const FEATURE_USAGE_TOO_MANY_REQUESTS_STATUS = 429;
