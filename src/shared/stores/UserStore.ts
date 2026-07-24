import Cookies from 'js-cookie';
import { fromPairs } from 'lodash-es';

import { httpClient } from '@/shared/api';
import { USER_TOKEN_COOKIE } from '@/shared/const/UI';
import { useIsDev } from '@/shared/utils/isDev';

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
  /** Отображаемое имя для комментариев; null — показывается логин. */
  displayName: string | null;
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
  currentPassword?: string;
  password: string;
};

export type TAuthResponse = {
  accessToken: string;
  tokenType: string;
};

export const useUserStore = defineStore('UserStore', () => {
  const route = useRoute();
  const router = useRouter();
  const isDev = useIsDev();

  const user = ref<TUser | null>(null);
  const isAuthenticated = computed(() => !!user.value);

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

  const isAdmin = computed(() =>
    roles.value.map((role) => role.role).includes(EUserRoles.ADMIN),
  );

  // Может редактировать контент: администратор или модератор.
  const isEditor = computed(() => {
    const currentRoles = roles.value.map((role) => role.role);

    return (
      currentRoles.includes(EUserRoles.ADMIN) ||
      currentRoles.includes(EUserRoles.MODERATOR)
    );
  });

  const avatar = computed(() => ({
    src: user.value?.avatar || null,
    error: '/icon/avatar.png',
    loading: '/icon/avatar.png',
  }));

  const clearUser = async () => {
    Cookies.remove(USER_TOKEN_COOKIE);
    Cookies.remove('ttg-user-token');

    user.value = null;

    if (route.name === 'profile') {
      await router.push({ name: 'index' });
    }
  };

  httpClient.setAuthFailureHandler(clearUser);

  const getUserToken = () =>
    isDev ? Cookies.get(USER_TOKEN_COOKIE) : undefined;

  const getUserInfo = async (): Promise<TUser> => {
    try {
      const resp = await httpClient.get<TUser>({
        url: '/user/info',
      });

      switch (resp.status) {
        case 200:
          user.value = resp.data;

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

      const resp = await httpClient.post({
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

      const resp = await httpClient.post<TAuthResponse>({
        url: '/auth/signin',
        payload: body,
        signal: controllers.authorization.signal,
      });

      switch (resp.status) {
        case 200:
          httpClient.saveAccessToken(resp.data.accessToken);

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
      const resp = await httpClient.post({
        url: '/account/password/reset-request',
        payload: { email },
        version: 'auth',
      });

      switch (resp.status) {
        case 204:
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

      const isResetConfirm = !!payload.resetToken;

      const resp = await httpClient.post({
        url: isResetConfirm
          ? '/account/password/reset-confirm'
          : '/account/change-password',
        payload: isResetConfirm
          ? {
              newPassword: payload.password,
              token: payload.resetToken,
            }
          : {
              currentPassword: payload.currentPassword,
              newPassword: payload.password,
            },
        signal: controllers.changePassword.signal,
        version: 'auth',
      });

      switch (resp.status) {
        case 204:
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

  /**
   * Сообщает сервису комментариев привести имя автора в его комментариях этого
   * сайта к текущему отображаемому имени. Fire-and-forget и best-effort: сервис
   * стамперит логин на новом комментарии, этот вызов заменяет его на имя. Ошибки
   * проглатываются — на пользовательский поток не влияет.
   */
  const syncCommentsName = () => {
    httpClient.post({ url: '/user/comments/sync-name' }).catch(() => undefined);
  };

  /**
   * Сохраняет новое отображаемое имя. После успеха обновляет профиль (чтобы имя
   * сразу подхватилось везде) и синхронизирует имя в уже оставленных комментариях.
   */
  const changeDisplayName = async (displayName: string) => {
    try {
      const resp = await httpClient.patch<{ displayName: string | null }>({
        url: '/user/display-name',
        payload: { displayName },
      });

      if (resp.status !== 200) {
        return Promise.reject(resp.statusText);
      }

      if (user.value) {
        user.value = { ...user.value, displayName: resp.data.displayName };
      }

      // Прокидываем новое имя в старые комментарии пользователя (best-effort).
      syncCommentsName();

      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const logout = async () => {
    try {
      const resp = await httpClient.post({ url: '/auth/signout' });

      switch (resp.status) {
        case 200:
          if (isDev) {
            Cookies.remove(USER_TOKEN_COOKIE, { path: '' });
          }

          Cookies.remove('ttg-user-token', { path: '' });

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
      const resp = await httpClient.get({
        url: '/user/status',
      });

      if (resp.status !== 200 || !resp.data) {
        clearUser();

        return Promise.resolve(false);
      }

      return Promise.resolve(resp.data as boolean);
    } catch (err) {
      // Разлогин при неуспешном refresh уже выполнил interceptor (authFailureHandler).
      // Здесь НЕ чистим пользователя: транзиентная ошибка (сеть/5xx) не должна
      // сбрасывать валидную сессию — иначе авторизация «отваливается» на ровном месте.
      return Promise.resolve(false);
    }
  };

  /**
   * Восстанавливает сессию при старте приложения. Гейтится клиентским маркером
   * `ttg-user-token` (живёт 365 дней, независимо от короткого access-токена): нет
   * маркера — аноним, refresh не дёргаем. Есть маркер — access-токен мог протухнуть,
   * поэтому грузим профиль через getUserInfo: `/user/info` отдаёт 401, на который
   * срабатывает refresh-interceptor и прозрачно продлевает сессию. Раньше старт шёл
   * через getUserStatus, который на протухшем токене возвращал 200 false (без refresh)
   * и молча разлогинивал пользователя с ещё живым refresh-токеном.
   */
  const restoreSession = async () => {
    if (!Cookies.get('ttg-user-token')) {
      return;
    }

    try {
      await getUserInfo();
    } catch (err) {
      await clearUser();
    }
  };

  return {
    user,
    roles,
    avatar,

    isAuthenticated,
    isAdmin,
    isEditor,

    clearUser,
    getUserToken,
    getUserStatus,
    restoreSession,
    getUserInfo,
    registration,
    authorization,
    resetPassword,
    changePassword,
    changeDisplayName,
    syncCommentsName,
    logout,
  };
});
