import { AxiosError } from 'axios';

import { routes } from '@/pages';

import { httpClient } from '@/shared/api';

import type { RouteLocationNormalized, RouteRecordRaw } from 'vue-router';

export const useRouterHelpers = () => {
  const isUrlAvailable = async (to: RouteLocationNormalized) => {
    try {
      const resp = await httpClient.rawHead({ url: to.fullPath });

      return Promise.resolve(resp.status);
    } catch (err) {
      if (err instanceof AxiosError) {
        return Promise.reject(err.response?.status);
      }

      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject(500);
    }
  };

  const isStaticUrl = (to: RouteLocationNormalized) => {
    const getAvailRoute = (route: RouteRecordRaw): Array<string | symbol> => {
      const list = [];

      if (route.name && (route.meta?.isStatic || !route.path.includes(':'))) {
        list.push(route.name);
      }

      if (route.children instanceof Array) {
        for (const child of route.children) {
          list.push(...getAvailRoute(child));
        }
      }

      return list;
    };

    const availRoutes = routes
      .flatMap((route) => getAvailRoute(route))
      .filter((route) => !!route);

    return !!to.name && availRoutes.includes(to.name);
  };

  const nextAvailable = async (to: RouteLocationNormalized) => {
    if (isStaticUrl(to)) {
      return true;
    }

    try {
      const status = await isUrlAvailable(to);

      switch (status) {
        case 200:
          return true;

        default:
          return { name: 'internal-server' };
      }
    } catch (errStatus) {
      switch (errStatus) {
        case 401:
          return { name: 'unauthorized' };

        case 403:
          return { name: 'forbidden' };

        case 404:
          return { name: 'not-found' };

        default:
          return { name: 'internal-server' };
      }
    }
  };

  return {
    isUrlAvailable,
    isStaticUrl,
    nextAvailable,
  };
};
