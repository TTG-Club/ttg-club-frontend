import type { FetchContext } from 'ofetch';

import { SESSION_EXPIRED_STATUS } from '#shared/consts';
import { shouldRefreshSession } from '#shared/utils';

/**
 * Клиент запросов к API сайта — `$api`. Встроенный `$fetch` Nuxt намеренно
 * не настраивается глобально, поэтому своё поведение живёт в отдельном
 * экземпляре.
 *
 * В браузере `$api` продлевает сессию на 401 и повторяет запрос один раз:
 * access-токен живёт недолго, а страница может быть открыта часами
 * (встроенный браузер Telegram, PWA). Одновременные запросы ждут одно
 * продление. На сервере продлить сессию нельзя: refresh-cookie уходит лишь
 * на `/api/v1/auth`.
 */
export default defineNuxtPlugin({
  name: 'api',
  setup() {
    if (import.meta.server) {
      return { provide: { api: $fetch.create({}) } };
    }

    const { isLoggedIn, refreshSession } = useUser();

    let pendingRefresh: Promise<boolean> | undefined;

    /** Продлевает сессию; одновременные запросы ждут одно продление. */
    function refreshOnce(): Promise<boolean> {
      pendingRefresh ??= refreshSession().finally(() => {
        pendingRefresh = undefined;
      });

      return pendingRefresh;
    }

    /**
     * Продлевает сессию на 401 и просит ofetch повторить запрос один раз.
     * Повтор идёт с `retry: 0`, поэтому второй 401 уже не продлевается.
     * @param context - контекст ответа ofetch
     */
    async function onResponseError(context: FetchContext): Promise<void> {
      const status = context.response?.status;

      if (
        !isLoggedIn.value
        || status === undefined
        || context.options.retry === 0
        || context.options.retry === false
        || !shouldRefreshSession(context.request, status)
      ) {
        return;
      }

      if (await refreshOnce()) {
        context.options.retry = 1;
        context.options.retryStatusCodes = [SESSION_EXPIRED_STATUS];
      }
    }

    return { provide: { api: $fetch.create({ onResponseError }) } };
  },
});
