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
        navItems.value = [...resp.data, VTTG_NAV_SECTION];

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
