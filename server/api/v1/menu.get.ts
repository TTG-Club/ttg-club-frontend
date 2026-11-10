import type { SiteMenuItem } from '#shared/types';

import { MENU_FALLBACK, MENU_PATH } from '#shared/consts';
import { siteMenuSchema } from '#shared/types';
import { getProxyTarget, withoutHiddenMenuItems } from '#shared/utils';

/** Сколько секунд меню отдаётся из кеша, прежде чем сервер спросит API снова. */
const MENU_CACHE_MAX_AGE = 10 * 60;

/** Сколько миллисекунд ждать ответа API, прежде чем отдать запасное меню. */
const MENU_FETCH_TIMEOUT = 3000;

/** Последнее меню, которое API отдал без ошибки. */
let lastMenu: Array<SiteMenuItem> = MENU_FALLBACK;

/**
 * Меню сайта с кешем. Меню хранится в базе и меняется редко, поэтому сервер
 * спрашивает API раз в несколько минут, а в остальное время отдаёт копию из
 * памяти. Не ответил API — отдаётся последнее удачное меню, а до первого
 * удачного ответа — запасная копия из кода: меню не пропадает.
 */
export default defineCachedEventHandler(
  async () => {
    try {
      const response = await $fetch(getProxyTarget(MENU_PATH, getUpstreams()), {
        timeout: MENU_FETCH_TIMEOUT,
      });

      lastMenu = withoutHiddenMenuItems(siteMenuSchema.parse(response));
    } catch (error) {
      console.error('[menu] API недоступен, отдаём сохранённое меню', error);
    }

    return lastMenu;
  },
  {
    name: 'site-menu',
    getKey: () => 'menu',
    maxAge: MENU_CACHE_MAX_AGE,
    swr: true,
  },
);
