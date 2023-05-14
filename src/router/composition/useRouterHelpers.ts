import type {
  NavigationGuardNext, RouteLocationNormalized, RouteRecordRaw
} from 'vue-router';
import { AxiosError } from 'axios';
import { routes } from '@/router/routes';
import { useAxios } from '@/common/composition/useAxios';

export const useRouterHelpers = () => {
  const isUrlAvailable = async (to: RouteLocationNormalized) => {
    const axios = useAxios();

    try {
      const resp = await axios.headRaw({ url: to.fullPath });

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

      if (route.name && (route.name === 'profile' || !route.path.includes(':'))) {
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
      .flatMap(route => getAvailRoute(route))
      .filter(route => !!route);

    return !!to.name && availRoutes.includes(to.name);
  };

  const nextAvailable = async (to: RouteLocationNormalized, next: NavigationGuardNext) => {
    if (isStaticUrl(to)) {
      next();

      return;
    }

    try {
      const status = await isUrlAvailable(to);

      switch (status) {
        case 200:
          next();

          break;

        default:
          next({ name: 'internal-server' });

          break;
      }
    } catch (errStatus) {
      switch (errStatus) {
        case 401:
          next({ name: 'unauthorized' });

          break;

        case 403:
          next({ name: 'forbidden' });

          break;

        case 404:
          next({ name: 'not-found' });

          break;

        default:
          next({ name: 'internal-server' });

          break;
      }
    }
  };

  return {
    isUrlAvailable,
    isStaticUrl,
    nextAvailable
  };
};
