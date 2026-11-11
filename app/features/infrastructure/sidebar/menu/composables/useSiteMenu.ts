import type { Ref } from 'vue';

import type { SiteMenuItem } from '../model';

import { MENU_FALLBACK, MENU_PATH } from '#shared/consts';

import { siteMenuSchema } from '../model';

/** Ключ данных меню: одно на всё приложение. */
const SITE_MENU_DATA_KEY = 'site-menu';

/**
 * Пункты меню сайта — одни на меню и главную. Грузятся ещё на сервере, где
 * лежат в кеше, поэтому меню готово к первому открытию без скелетона. Пока
 * ответа нет или API недоступен, стоит запасная копия меню из кода.
 *
 * @returns пункты меню
 */
export function useSiteMenu(): Ref<Array<SiteMenuItem>> {
  const api = useApi();

  const { data: menuItems } = useAsyncData(
    SITE_MENU_DATA_KEY,
    async () => siteMenuSchema.parse(await api(MENU_PATH)),
    { default: () => MENU_FALLBACK },
  );

  return menuItems;
}
