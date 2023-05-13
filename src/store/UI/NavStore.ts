import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import orderBy from 'lodash/orderBy';
import type { RouteLocationNormalized } from 'vue-router';
import { useAxios } from '@/common/composition/useAxios';
import isDev from '@/common/helpers/isDev';

export type TNavItem = {
  name: string
  icon?: string
  url?: string
  onlyDev?: boolean
  external?: boolean
  children?: Array<TNavItem>
  order: number
  onIndex?: boolean
  indexOrder?: number
}

export type TPartner = {
  name: string
  description?: string
  img: string
  url: string
  order: number
}

export const useNavStore = defineStore('NavStore', () => {
  const http = useAxios();
  const isShowPopover = ref(false);
  const isShowSearch = ref(false);

  /* Menu */
  const navItems = ref<Array<TNavItem>>([]);

  const showedNavItems = computed(() => (
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
  ));

  const initNavItems = async () => {
    if (navItems.value.length) {
      return Promise.resolve();
    }

    try {
      const resp = await http.get({
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

  const showedPartners = computed(() => (
    orderBy(
      partners.value,
      ['order'],
      ['asc']
    )
  ));

  const initPartners = async () => {
    if (partners.value.length) {
      return Promise.resolve();
    }

    try {
      const resp = await http.get({
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
  const metaInfo = ref(undefined);

  const hidePopovers = () => {
    isShowPopover.value = false;
    isShowSearch.value = false;
  };

  const getMetaByURL = async (url: string) => {
    try {
      const resp = await http.get({
        url: `/meta${ url }`
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
    let el: HTMLMetaElement | null = document.querySelector(`meta[name="${ name }"]`);

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

  const updateMetaByURL = async (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
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
