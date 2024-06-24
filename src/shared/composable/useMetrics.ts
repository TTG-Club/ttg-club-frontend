import { event, pageview } from 'vue-gtag';

import { routes } from '@/pages';

import { useIsDev } from '@/shared/utils/isDev';

import type { MaybeRef } from '@vueuse/core';
import type { RouteLocationNormalized } from 'vue-router';

export interface ISearchItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_brand?: string;
}

export const useMetrics = () => {
  const isDev = useIsDev();

  const sendSearchMetrics = (search: MaybeRef<string>) => {
    if (isDev) {
      return;
    }

    const term = unref(search);

    event('search', {
      search_term: term,
    });
  };

  const sendSearchViewResultsMetrics = (
    search: MaybeRef<string>,
    items?: MaybeRef<Array<ISearchItem>>,
  ) => {
    if (isDev) {
      return;
    }

    const term = unref(search);
    const list = unref(items);

    const eventParams: {
      search_term: string;
      items?: Array<ISearchItem>;
    } = {
      search_term: term,
    };

    if (list instanceof Array) {
      eventParams.items = list;
    }

    event('view_search_results', eventParams);
  };

  const sendPageViewMetrics = (to: RouteLocationNormalized) => {
    if (isDev) {
      return;
    }

    const errGroup = routes.find((route) => route.name === 'unknown-error');

    const exclude =
      errGroup?.children?.map((child) => child.name).filter((name) => !!name) ||
      [];

    exclude.push('profile');
    exclude.push('reset-password');

    if (to.name && exclude.includes(to.name)) {
      return;
    }

    pageview({
      page_path: to.path,
      page_location: window.location.origin + to.fullPath,
    });
  };

  const sendSignUpMetrics = (method: MaybeRef<string> = 'default') => {
    if (isDev) {
      return;
    }

    event('sign_up', {
      method: unref(method),
    });
  };

  const sendLoginMetrics = (method: MaybeRef<string> = 'default') => {
    if (isDev) {
      return;
    }

    event('login', {
      method: unref(method),
    });
  };

  const sendShareMetrics = (
    payload: {
      method: MaybeRef<string>;
      id?: MaybeRef<string>;
      category?: MaybeRef<string>;
    } = { method: 'link_copy' },
  ) => {
    if (isDev) {
      return;
    }

    const method = unref(payload.method);
    const id = unref(payload.id);
    const category = unref(payload.category);

    const eventParams: {
      method: string;
      item_id?: string;
      content_type?: string;
    } = { method };

    if (id) {
      eventParams.item_id = id;
    }

    if (category) {
      eventParams.content_type = category;
    }

    event('share', eventParams);
  };

  return {
    sendSearchMetrics,
    sendSearchViewResultsMetrics,
    sendPageViewMetrics,
    sendSignUpMetrics,
    sendLoginMetrics,
    sendShareMetrics,
  };
};
