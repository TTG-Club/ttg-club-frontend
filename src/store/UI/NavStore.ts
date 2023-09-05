import orderBy from 'lodash/orderBy';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { useAxios } from '@/shared/composition/useAxios';
import isDev from '@/shared/helpers/isDev';
import type { Maybe } from '@/shared/types/Utility';

import type { RouteLocationNormalized } from 'vue-router';

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

export const useNavStore = defineStore('NavStore', () => {
  const http = useAxios();
  const isShowPopover = ref(false);
  const isShowSearch = ref(false);

  /* Menu */
  const navItems = ref<Array<TNavItem>>([]);

  const showedNavItems = computed(() =>
    orderBy(
      navItems.value
        .filter(group => {
          if (isDev) {
            return true;
          }

          return !group.onlyDev;
        })
        .map(group => ({
          ...group,
          children: orderBy(
            group.children?.filter(link => {
              if (isDev) {
                return true;
              }

              return !link.onlyDev;
            }) || [],
            ['order'],
            ['asc']
          )
        })),
      ['order'],
      ['asc']
    )
  );

  const initNavItems = async () => {
    if (navItems.value.length) {
      return Promise.resolve();
    }

    try {
      const resp = await http.get<Array<TNavItem>>({
        url: '/menu'
      });

      if (resp.status === 200) {
        navItems.value = resp.data;

        return Promise.resolve();
      }

      return Promise.reject(resp.statusText);
    } catch (err) {
      return Promise.reject(err);
    }
  };

  /* Partners */
  const partners = ref<TPartner[]>([]);

  const showedPartners = computed(() =>
    orderBy(partners.value, ['order'], ['asc'])
  );

  const initPartners = async () => {
    if (partners.value.length) {
      return Promise.resolve();
    }

    try {
      const resp = await http.get<Array<TPartner>>({
        url: '/partners'
      });

      if (resp.status === 200) {
        partners.value = resp.data;

        return Promise.resolve();
      }

      return Promise.reject(resp.statusText);
    } catch (err) {
      return Promise.reject(err);
    }
  };

  /* Meta */
  const metaInfo = ref<Maybe<TMetaInfo>>(undefined);

  const hidePopovers = () => {
    isShowPopover.value = false;
    isShowSearch.value = false;
  };

  const getMetaByURL = async (url: string) => {
    try {
      const resp = await http.get<TMetaInfo>({
        url: `/meta${url}`
      });

      if (resp.status === 200) {
        metaInfo.value = resp.data;

        return Promise.resolve(resp.data);
      }

      return Promise.reject(resp.statusText);
    } catch (err) {
      return Promise.resolve(err);
    }
  };

  const getMetaTag = (name: string): HTMLMetaElement => {
    let el: HTMLMetaElement | null = document.querySelector(
      `meta[name="${name}"]`
    );

    if (!el) {
      const meta = document.createElement('meta');

      meta.name = name;

      el = document.getElementsByTagName('head')[0].appendChild(meta);
    }

    return el;
  };

  // TODO: Доделать типизацию
  const setMeta = (meta: any) => {
    if (meta?.title) {
      document.title = meta.title;
    }

    if (meta?.description) {
      const description = getMetaTag('description');

      description.setAttribute('content', meta.description);
    }
  };

  const updateMetaByURL = async (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ) => {
    if (to.path === from.path) {
      return Promise.resolve();
    }

    try {
      const meta = await getMetaByURL(to.path);

      setMeta(meta);

      return Promise.resolve();
    } catch (err) {
      return Promise.resolve();
    }
  };

  return {
    isShowPopover,
    isShowSearch,
    hidePopovers,

    // Menu
    navItems,
    showedNavItems,
    initNavItems,

    // Partners
    showedPartners,
    initPartners,

    // Meta
    metaInfo,
    updateMetaByURL
  };
});
