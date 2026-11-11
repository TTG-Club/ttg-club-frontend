import type { ComputedRef } from 'vue';

import type { HomeNavLink, HomeSectionLink } from '../model';

import { useSiteMenu } from '~infrastructure/sidebar/menu';

import { getHomeSections, getHomeTools } from '../model';

interface HomeMenu {
  /** Плитки разделов */
  sections: ComputedRef<Array<HomeSectionLink>>;
  /** Лента инструментов под поиском */
  tools: ComputedRef<Array<HomeNavLink>>;
}

/**
 * Разделы и инструменты главной из меню сайта. Меню грузится ещё на сервере:
 * плита разделов и лента инструментов — первый экран главной, и поисковики
 * должны видеть их ссылки. Не загрузилось меню — стоит запасная копия.
 *
 * @returns разделы и инструменты
 */
export function useHomeMenu(): HomeMenu {
  const menuItems = useSiteMenu();

  const sections = computed(() =>
    getHomeSections(menuItems.value, import.meta.dev),
  );

  const tools = computed(() => getHomeTools(menuItems.value, import.meta.dev));

  return { sections, tools };
}
