import type { ComputedRef } from 'vue';

import type { HomeNavLink, HomeSectionLink } from '../model';

import { MENU_PATH } from '~/shared/consts';
import { siteMenuSchema } from '~infrastructure/sidebar/menu/model';

import { getHomeSections, getHomeTools, HOME_MENU_DATA_KEY } from '../model';

interface HomeMenu {
  /** Плитки разделов */
  sections: ComputedRef<Array<HomeSectionLink>>;
  /** Лента инструментов под поиском */
  tools: ComputedRef<Array<HomeNavLink>>;
}

/**
 * Разделы и инструменты главной из меню сайта. Меню грузится ещё на сервере:
 * плита разделов и лента инструментов — первый экран главной, и поисковики
 * должны видеть их ссылки. Не загрузилось меню — плита и лента пустые.
 *
 * @returns разделы и инструменты
 */
export function useHomeMenu(): HomeMenu {
  const { data: menuItems } = useAsyncData(
    HOME_MENU_DATA_KEY,
    async () => siteMenuSchema.parse(await $fetch(MENU_PATH)),
    { default: () => [] },
  );

  const sections = computed(() =>
    getHomeSections(menuItems.value, import.meta.dev),
  );

  const tools = computed(() => getHomeTools(menuItems.value, import.meta.dev));

  return { sections, tools };
}
