import Cookies from 'js-cookie';
import { fromPairs } from 'lodash-es';
import { defineStore } from 'pinia';
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAxios } from '@/shared/composables/useAxios';
import { USER_TOKEN_COOKIE } from '@/shared/constants/UI';
import { useIsDev } from '@/shared/helpers/isDev';

export enum EUserRoles {
  USER = 'USER',
  WRITER = 'WRITER',
  SUBSCRIBER = 'SUBSCRIBER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

export enum EUserRolesRus {
  USER = 'пользователь',
  WRITER = 'писатель',
  SUBSCRIBER = 'подписчик',
  MODERATOR = 'модератор',
  ADMIN = 'администратор',
}

export type TUser = {
  username: string;
  name: string;
  email: string;
  roles: EUserRoles[];
  avatar: string;
};

export type TRegBody = {
  username: string;
  password: string;
  email: string;
};

export type TAuthBody = {
  usernameOrEmail: string;
  password: string;
  remember: boolean;
};

export type TChangePassBody = {
  userToken?: string;
  resetToken?: string;
  password: string;
};

export type TAuthResponse = {
  accessToken: string;
  tokenType: string;
};

export const useUserStore = defineStore('UserStore', () => {
  const route = useRoute();
  const router = useRouter();
  const http = useAxios();
  const isDev = useIsDev();

  const user = ref<TUser | null>(null);
  const isAuthenticated = ref<boolean>(false);

  const controllers = reactive<{
    registration?: AbortController;
    authorization?: AbortController;
    changePassword?: AbortController;
  }>({});

  const roles = computed(() => {
    if (!user.value?.roles || !Array.isArray(user.value.roles)) {
      return [];
    }

    const entries = Object.entries(EUserRolesRus) as [
      EUserRoles,
      EUserRolesRus,
    ][];

    const availRoles: { [key in EUserRoles]?: EUserRolesRus } =
      fromPairs(entries);

    const { roles: userRoles } = user.value;

    const translated = userRoles
      .map((role) => ({
        role,
        name: availRoles[role],
      }))
      .filter((role) => !!role.name);

    if (!translated.length) {
      return [];
    }

    return translated;
  });

  const avatar = computed(() => ({
    src: user.value?.avatar || null,
    error: '/icon/avatar.png',
    loading: '/icon/avatar.png',
  }));

  const clearUser = async () => {
    user.value = null;
    isAuthenticated.value = false;

    Cookies.remove(USER_TOKEN_COOKIE);

    if (route.name === 'profile') {
      await router.push({ name: 'index' });
    }
  };

  const getUserToken = () => Cookies.get(USER_TOKEN_COOKIE);

  const getUserInfo = async (): Promise<TUser> => {
    try {
      const resp = await http.get<TUser>({
        url: '/user/info',
      });

      switch (resp.status) {
        case 200:
          user.value = resp.data;
          isAuthenticated.value = true;

          return Promise.resolve(resp.data);
        default:
          return Promise.reject(resp.statusText);
      }
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const registration = async (body: TRegBody) => {
    if (controllers.registration instanceof AbortController) {
      controllers.registration.abort();
    }

    try {
      if (Object.values(body).find((item) => !item)) {
        return Promise.reject(new Error('All fields are required to fill'));
      }

      controllers.registration = new AbortController();

      const resp = await http.post({
        url: '/auth/signup',
        payload: body,
        signal: controllers.registration.signal,
      });

      switch (resp.status) {
        case 200:
          return Promise.resolve();
        default:
          return Promise.reject(resp.statusText);
      }
    } catch (err) {
      return Promise.reject(err);
    } finally {
      controllers.registration = undefined;
    }
  };

  const authorization = async (body: TAuthBody) => {
    if (controllers.authorization instanceof AbortController) {
      controllers.authorization.abort();
    }

    try {
      if (
        Object.values(body).find((item) => typeof item === 'string' && !item)
      ) {
        return Promise.reject(new Error('All fields are required to fill'));
      }

      controllers.authorization = new AbortController();

      const resp = await http.post<TAuthResponse>({
        url: '/auth/signin',
        payload: body,
        signal: controllers.authorization.signal,
      });

      switch (resp.status) {
        case 200:
          if (isDev) {
            Cookies.set(USER_TOKEN_COOKIE, resp.data.accessToken, {
              expires: 365,
            });
          }

          await getUserInfo();

          return Promise.resolve();
        case 401:
          // eslint-disable-next-line prefer-promise-reject-errors
          return Promise.reject('Неверный логин или пароль');
        default:
          return Promise.reject(resp.statusText);
      }
    } catch (err) {
      return Promise.reject(err);
    } finally {
      controllers.authorization = undefined;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const resp = await http.get({
        url: '/auth/change/password',
        payload: { email },
      });

      switch (resp.status) {
        case 200:
          return Promise.resolve();
        default:
          return Promise.reject(resp.statusText);
      }
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const changePassword = async (payload: TChangePassBody) => {
    if (controllers.changePassword instanceof AbortController) {
      controllers.changePassword.abort();
    }

    try {
      controllers.changePassword = new AbortController();

      const resp = await http.post({
        url: '/auth/change/password',
        payload,
        signal: controllers.changePassword.signal,
      });

      switch (resp.status) {
        case 200:
          return Promise.resolve();
        default:
          return Promise.reject(resp.statusText);
      }
    } catch (err) {
      return Promise.reject(err);
    } finally {
      controllers.changePassword = undefined;
    }
  };

  const logout = async () => {
    try {
      const resp = await http.post({ url: '/auth/signout' });

      switch (resp.status) {
        case 200:
          if (isDev) {
            Cookies.remove(USER_TOKEN_COOKIE, { path: '' });
          }

          return Promise.resolve();
        default:
          return Promise.reject();
      }
    } catch (err) {
      return Promise.reject(err);
    } finally {
      clearUser();
    }
  };

  const getUserStatus = async () => {
    try {
      const resp = await http.get({
        url: '/user/status',
      });

      if (resp.status !== 200 || !resp.data) {
        clearUser();

        return Promise.resolve(false);
      }

      isAuthenticated.value = true;

      return Promise.resolve(resp.data as boolean);
    } catch (err) {
      clearUser();

      return Promise.resolve(false);
    }
  };

  return {
    user,
    isAuthenticated,
    roles,
    avatar,

    clearUser,
    getUserToken,
    getUserStatus,
    getUserInfo,
    registration,
    authorization,
    resetPassword,
    changePassword,
    logout,
  };
});
