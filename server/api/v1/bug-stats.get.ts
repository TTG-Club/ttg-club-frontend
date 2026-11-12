import type { BugStats } from '#shared/types';

import { BUG_STATS_SOURCE_PATH } from '#shared/consts';
import { bugStatsSchema } from '#shared/types';

/** Сколько секунд рейтинг отдаётся из кеша, прежде чем сервер спросит снова. */
const BUG_STATS_CACHE_MAX_AGE = 5 * 60;

/** Сколько миллисекунд ждать ответа нового сайта. */
const BUG_STATS_FETCH_TIMEOUT = 5000;

/** Последний рейтинг, который новый сайт отдал без ошибки. */
let lastStats: BugStats | undefined;

/**
 * Рейтинг охотников за багами для главной. Его считает new.ttg.club (там
 * логины уже заменены именами и аватарами), но чужим сайтам из браузера он
 * его не отдаёт — поэтому за ним ходит сервер. Рейтинг меняется редко и
 * кешируется; не ответил новый сайт — отдаётся последний удачный ответ, а
 * если его ещё не было — ошибка, и блок показывает заглушку.
 */
export default defineCachedEventHandler(
  async (event) => {
    const { newSiteUrl } = useRuntimeConfig(event).public;

    try {
      const response = await $fetch(`${newSiteUrl}${BUG_STATS_SOURCE_PATH}`, {
        timeout: BUG_STATS_FETCH_TIMEOUT,
      });

      lastStats = bugStatsSchema.parse(response);
    } catch (error) {
      console.error('[bug-stats] новый сайт не отдал рейтинг охотников', error);
    }

    if (!lastStats) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Bug stats are unavailable',
      });
    }

    return lastStats;
  },
  {
    name: 'bug-stats',
    getKey: () => 'bug-stats',
    maxAge: BUG_STATS_CACHE_MAX_AGE,
    swr: true,
  },
);
