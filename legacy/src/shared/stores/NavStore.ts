import { orderBy } from 'lodash-es';

import { httpClient } from '@/shared/api';
import isDev from '@/shared/utils/isDev';

export type TNavItem = {
  name: string;
  icon?: string;
  url?: string;
  onlyDev?: boolean;
  external?: boolean;
  children?: Array<TNavItem>;
  order: number;
  onIndex?: boolean;
  indexOrder?: number;
  /** Старая версия переехавшего раздела: есть в меню, но не на главной */
  legacy?: boolean;
};

export type TPartner = {
  name: string;
  description?: string;
  img: string;
  url: string;
  order: number;
};

export type TMetaInfo = {
  title: string;
  description: string;
  menu: string;
};

const VTTG_NAV_SECTION: TNavItem = {
  name: 'Virtual TTG',
  icon: 'menu/filled/information',
  order: 7,
  children: [
    {
      name: 'Информация',
      url: 'https://new.ttg.club/vttg',
      external: true,
      order: 1,
    },
  ],
};

/** Токенатор переехал на новый сайт */
export const TOKENATOR_URL = 'https://new.ttg.club/tokenator';

/** Здешний токенатор — теперь его старая версия */
const TOKENATOR_LEGACY_URL = '/tools/tokenator';

/**
 * Пункт токенатора из меню бэкенда ведёт на новый сайт, а сразу за ним встаёт
 * ссылка на здешнюю старую версию. Порядок у обоих тот же, что у исходного
 * пункта: сортировка меню устойчивая, и они остаются рядом.
 * @param navItems - группы меню с бэкенда
 */
function withNewTokenator(navItems: Array<TNavItem>): Array<TNavItem> {
  return navItems.map((group) => ({
    ...group,
    children: group.children?.flatMap((link) =>
      link.url === TOKENATOR_LEGACY_URL
        ? [
            { ...link, url: TOKENATOR_URL, external: true },
            { ...link, name: `${link.name} (старая версия)`, legacy: true },
          ]
        : [link],
    ),
  }));
}

export const useNavStore = defineStore('NavStore', () => {
  /* Menu */
  const navItems = ref<Array<TNavItem>>([]);

  const showedNavItems = computed(() =>
    orderBy(
      navItems.value
        .filter((group) => {
          if (isDev) {
            return true;
          }

          return !group.onlyDev;
        })
        .map((group) => ({
          ...group,
          children: orderBy(
            group.children?.filter((link) => {
              if (isDev) {
                return true;
              }

              return !link.onlyDev;
            }) || [],
            ['order'],
            ['asc'],
          ),
        })),
      ['order'],
      ['asc'],
    ),
  );

  const initNavItems = async () => {
    if (navItems.value.length) {
      return Promise.resolve();
    }

    try {
      const resp = await httpClient.get<Array<TNavItem>>({
        url: '/menu',
      });

      if (resp.status === 200) {
        navItems.value = [...withNewTokenator(resp.data), VTTG_NAV_SECTION];

        return Promise.resolve();
      }

      return Promise.reject(resp.statusText);
    } catch (err) {
      return Promise.reject(err);
    }
  };

  return {
    // Menu
    navItems,
    showedNavItems,
    initNavItems,
  };
});
