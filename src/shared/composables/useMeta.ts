import { ref } from 'vue';

import { httpClient } from '@/shared/api';
import type { TMetaInfo } from '@/shared/stores/NavStore';
import type { Maybe } from '@/shared/types/Utility';

import type { RouteLocationNormalized } from 'vue-router';

export function useMeta() {
  /* Meta */
  const metaInfo = ref<Maybe<TMetaInfo>>(undefined);

  const getMetaByURL = async (url: string) => {
    try {
      const resp = await httpClient.get<TMetaInfo>({
        url: `/meta${url}`,
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
      `meta[name="${name}"]`,
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
    from: RouteLocationNormalized,
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
    metaInfo,
    updateMetaByURL,
  };
}
