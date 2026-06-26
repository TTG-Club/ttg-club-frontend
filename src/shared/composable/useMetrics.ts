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

// init() Яндекс.Метрики в index.html сам засчитывает первую загрузку страницы,
// поэтому ручной hit отправляем только начиная со второй (SPA) навигации — иначе
// просмотр лендинга задвоится. Флаг общий на всё приложение (singleton модуля).
let isInitialYandexHit = true;

// Имена служебных маршрутов (страницы ошибок, профиль, восстановление пароля,
// подтверждение почты), просмотры которых в метрику не отправляем. Список
// статичен, поэтому вычисляем его один раз на уровне модуля.
const EXCLUDED_PAGE_VIEW_ROUTE_NAMES = (() => {
  const errorGroup = routes.find((route) => route.name === 'unknown-error');

  const names =
    errorGroup?.children?.map((child) => child.name).filter((name) => !!name) ||
    [];

  names.push('profile', 'reset-password', 'verify-email');

  return names;
})();

const isExcludedPageViewRoute = (to: RouteLocationNormalized): boolean =>
  !!to.name && EXCLUDED_PAGE_VIEW_ROUTE_NAMES.includes(to.name);

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

  // Google Analytics (gtag): в index.html выставлен send_page_view: false,
  // поэтому каждый просмотр отправляем вручную. Вызывается и при смене маршрута,
  // и при подгрузке следующей страницы пагинации (бесконечный скролл).
  const sendPageViewMetrics = (to: RouteLocationNormalized) => {
    if (isDev || isExcludedPageViewRoute(to)) {
      return;
    }

    pageview({
      page_path: to.path,
      page_location: window.location.origin + to.fullPath,
    });
  };

  // Яндекс.Метрика: vue-router в history-режиме (createWebHistory) переходы сам
  // не отслеживает, поэтому hit при смене маршрута отправляем вручную. Вызывать
  // ТОЛЬКО из router.afterEach — так же, как nuxt-yandex-metrika на new.ttg.club,
  // чтобы оба сайта считали одинаково (пагинация хиты в Метрику не шлёт).
  const sendYandexPageView = (
    to: RouteLocationNormalized,
    from?: RouteLocationNormalized,
  ) => {
    if (isDev) {
      return;
    }

    // «Съедаем» флаг до фильтра exclude, чтобы он соответствовал именно первой
    // навигации роутера (начальной отрисовке лендинга), которую Метрика уже
    // учла через init() в index.html, — иначе первый просмотр задвоится.
    const isInitialNavigation = isInitialYandexHit;

    isInitialYandexHit = false;

    if (isInitialNavigation || isExcludedPageViewRoute(to)) {
      return;
    }

    window.ym?.(
      import.meta.env.VITE_YM_ID,
      'hit',
      window.location.origin + to.fullPath,
      {
        referer: from
          ? window.location.origin + from.fullPath
          : document.referrer,
      },
    );
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
    sendYandexPageView,
    sendSignUpMetrics,
    sendLoginMetrics,
    sendShareMetrics,
  };
};
