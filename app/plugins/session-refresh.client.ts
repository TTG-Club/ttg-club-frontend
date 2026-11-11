import type { FetchContext } from 'ofetch';

import { SESSION_EXPIRED_STATUS } from '#shared/consts';
import { shouldRefreshSession } from '#shared/utils';

/**
 * Продление сессии для всех запросов браузера. Access-токен живёт недолго, а
 * страница может быть открыта часами (встроенный браузер Telegram, PWA): без
 * этого любое сохранение после истечения токена получает 401. На 401 сессия
 * продлевается один раз для всех одновременных запросов, и запрос
 * повторяется.
 */
export default defineNuxtPlugin({
  name: 'session-refresh',
  setup() {
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

    globalThis.$fetch = $fetch.create({ onResponseError });
  },
});
