import type { YandexMetrikaQueue } from '../model';

import { consola } from 'consola';

import {
  GOOGLE_ANALYTICS_ID_QUERY_PARAMETER,
  GOOGLE_ANALYTICS_SCRIPT_MARKER,
  YANDEX_METRIKA_DESTRUCT_METHOD,
  YANDEX_METRIKA_HIT_METHOD,
  YANDEX_METRIKA_INIT_METHOD,
  YANDEX_METRIKA_INIT_OPTIONS,
  YANDEX_METRIKA_SCRIPT_KEY,
  YANDEX_METRIKA_SCRIPT_URL,
} from '../model';

/** Создаёт стандартную очередь Метрики до загрузки её API. */
function createYandexMetrikaQueue(): YandexMetrikaQueue {
  const queue: YandexMetrikaQueue = (counterId, method, ...parameters) => {
    (queue.a ??= []).push([counterId, method, ...parameters]);
  };

  queue.l = Date.now();

  return queue;
}

/**
 * Собирает адрес скрипта Google Analytics с идентификатором счётчика.
 * @param scriptUrl Базовый адрес скрипта из настроек `nuxt-gtag`.
 * @param counterId Идентификатор счётчика.
 */
function buildGoogleAnalyticsScriptUrl(
  scriptUrl: string,
  counterId: string,
): string {
  const url = new URL(scriptUrl);

  url.searchParams.set(GOOGLE_ANALYTICS_ID_QUERY_PARAMETER, counterId);

  return url.toString();
}

/** Подключает статистику при запуске приложения и освобождает её при остановке. */
export function useAnalytics(): void {
  const nuxtApp = useNuxtApp();
  const router = useRouter();

  const {
    public: { gtag, yandexMetrika },
  } = useRuntimeConfig();

  const {
    disableAnalytics: disableGoogleAnalytics,
    enableAnalytics: enableGoogleAnalytics,
  } = useGtag();

  const metrikaScript = yandexMetrika.id
    ? useScript<Record<string, unknown>>(
        { key: YANDEX_METRIKA_SCRIPT_KEY, src: YANDEX_METRIKA_SCRIPT_URL },
        { trigger: 'manual' },
      )
    : undefined;

  let isRouterReady = false;
  let isYandexMetrikaStarted = false;
  let isDisposed = false;

  /** Запускает Метрику, если приложение ещё активно после загрузки скрипта. */
  async function startYandexMetrika(): Promise<void> {
    if (!metrikaScript) {
      return;
    }

    window.ym ??= createYandexMetrikaQueue();

    try {
      if (metrikaScript.status.value === 'error') {
        await metrikaScript.reload();
      } else {
        await metrikaScript.load();
      }

      if (isDisposed) {
        return;
      }

      window.ym?.(
        yandexMetrika.id,
        YANDEX_METRIKA_INIT_METHOD,
        YANDEX_METRIKA_INIT_OPTIONS,
      );

      isYandexMetrikaStarted = true;
    } catch (error) {
      if (!isDisposed) {
        consola.warn('Не удалось загрузить Яндекс.Метрику', error);
      }
    }
  }

  /**
   * Подключает скрипт Google Analytics один раз и с `defer`.
   *
   * Не через `useGtag().initialize()`: тот вставляет скрипт без `async` и
   * `defer`, и unhead предупреждает о блокировке отрисовки. Очередь `dataLayer`
   * с настройкой счётчика к этому моменту уже создал плагин `nuxt-gtag` — в
   * ручном режиме он делает это сразу, не загружая только сам скрипт.
   */
  function connectGoogleAnalyticsScript(): void {
    nuxtApp.runWithContext(() =>
      useHead({
        script: [
          {
            src: buildGoogleAnalyticsScriptUrl(gtag.url, gtag.id),
            defer: true,
            [GOOGLE_ANALYTICS_SCRIPT_MARKER]: '',
          },
        ],
      }),
    );
  }

  /** Останавливает сбор событий уже загруженными счётчиками. */
  function stopAnalytics(): void {
    if (gtag.id) {
      disableGoogleAnalytics();
    }

    if (isYandexMetrikaStarted) {
      window.ym?.(yandexMetrika.id, YANDEX_METRIKA_DESTRUCT_METHOD);
      isYandexMetrikaStarted = false;
    }
  }

  // Начальный просмотр Метрика отправляет при инициализации.
  void router
    .isReady()
    .then(() => {
      if (!isDisposed) {
        isRouterReady = true;
      }
    })
    .catch((error: unknown) => {
      if (!isDisposed) {
        consola.warn('Роутер не готов к учёту просмотров', error);
      }
    });

  const removeAfterEach = router.afterEach((destination, origin, failure) => {
    if (failure || !isRouterReady || !isYandexMetrikaStarted || isDisposed) {
      return;
    }

    window.ym?.(
      yandexMetrika.id,
      YANDEX_METRIKA_HIT_METHOD,
      destination.fullPath,
      {
        referer: origin.fullPath,
      },
    );
  });

  onScopeDispose(() => {
    isDisposed = true;
    removeAfterEach();
    stopAnalytics();
    metrikaScript?.remove();
  });

  void startYandexMetrika();

  if (gtag.id) {
    enableGoogleAnalytics();
    connectGoogleAnalyticsScript();
  }
}
