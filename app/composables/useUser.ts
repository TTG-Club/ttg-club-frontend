import type { SignInCredentials, UserProfile } from '~/shared/types';

import { consola } from 'consola';

import {
  USER_SESSION_MARKER_COOKIE,
  USER_SESSION_MARKER_MAX_AGE_SECONDS,
  USER_TOKEN_COOKIE,
} from '#shared/consts';
import {
  AUTH_REFRESH_PATH,
  AUTH_SIGN_IN_PATH,
  AUTH_SIGN_OUT_PATH,
  USER_INFO_PATH,
} from '~/shared/consts';
import { authTokenSchema, Role, userProfileSchema } from '~/shared/types';

/** Ключ состояния профиля: на клиент оно приходит в payload SSR. */
const USER_STATE_KEY = 'user-profile';

/** Ключ признака загрузки профиля. */
const USER_PENDING_STATE_KEY = 'user-profile-pending';

type Fetcher = typeof $fetch;

/**
 * Загружает и проверяет профиль текущего пользователя.
 * @param fetcher - клиент запросов; на сервере это `useRequestFetch`, чтобы
 * ушли cookie посетителя
 */
async function requestProfile(fetcher: Fetcher): Promise<UserProfile> {
  const response: unknown = await fetcher(USER_INFO_PATH);

  return userProfileSchema.parse(response);
}

/**
 * Возвращает access-токен из ответа входа или продления сессии.
 * @param response - тело ответа бэкенда
 */
function parseAccessToken(response: unknown): string {
  return authTokenSchema.parse(response).accessToken;
}

/**
 * Пользователь сайта и его сессия.
 *
 * Сессию держит бэкенд в httpOnly-cookie, поэтому SSR узнаёт пользователя по
 * access-cookie, а продлить истёкшую сессию может только браузер: refresh-cookie
 * уходит лишь на `/api/v1/auth`. Видимая отметка о входе общая со старым SPA.
 */
export function useUser() {
  const user = useState<UserProfile | null>(USER_STATE_KEY, () => null);
  const pending = useState<boolean>(USER_PENDING_STATE_KEY, () => false);

  const accessToken = useCookie<string | null>(USER_TOKEN_COOKIE, {
    readonly: true,
  });

  const sessionMarker = useCookie<string | null>(USER_SESSION_MARKER_COOKIE, {
    maxAge: USER_SESSION_MARKER_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
  });

  const isLoggedIn = computed(() => !!user.value);

  const roles = computed(() => user.value?.roles ?? []);

  const isAdmin = computed(() => roles.value.includes(Role.ADMIN));

  /**
   * Перечитывает профиль. При ошибке пользователь считается вышедшим.
   * @param fetcher - клиент запросов
   * @returns удалось ли получить профиль
   */
  async function fetchProfile(fetcher: Fetcher = $fetch): Promise<boolean> {
    pending.value = true;

    try {
      user.value = await requestProfile(fetcher);

      return true;
    } catch {
      user.value = null;

      return false;
    } finally {
      pending.value = false;
    }
  }

  /**
   * Восстанавливает пользователя при SSR, если браузер прислал access-cookie.
   * @param fetcher - клиент запросов с cookie посетителя
   */
  async function restoreOnServer(fetcher: Fetcher): Promise<void> {
    if (!accessToken.value) {
      return;
    }

    await fetchProfile(fetcher);
  }

  /**
   * Продлевает сессию в браузере, если SSR не узнал пользователя, а отметка о
   * входе осталась (истёк access-токен). Без отметки запрос не делается, чтобы
   * не дёргать бэкенд на каждый визит гостя.
   */
  async function restoreOnClient(): Promise<void> {
    if (user.value || !sessionMarker.value) {
      return;
    }

    try {
      sessionMarker.value = parseAccessToken(
        await $fetch(AUTH_REFRESH_PATH, { method: 'POST' }),
      );
    } catch {
      sessionMarker.value = null;

      return;
    }

    if (!(await fetchProfile())) {
      sessionMarker.value = null;
    }
  }

  /**
   * Входит в аккаунт и загружает профиль.
   * @param credentials - логин или почта, пароль и «запомнить меня»
   * @returns удалось ли загрузить профиль после входа
   */
  async function signIn(credentials: SignInCredentials): Promise<boolean> {
    const response: unknown = await $fetch(AUTH_SIGN_IN_PATH, {
      method: 'POST',
      body: credentials,
    });

    sessionMarker.value = parseAccessToken(response);

    return await fetchProfile();
  }

  /** Выходит из аккаунта. Локально сессия сбрасывается даже при ошибке сети. */
  async function signOut(): Promise<void> {
    try {
      await $fetch(AUTH_SIGN_OUT_PATH, { method: 'POST' });
    } catch (error) {
      consola.error('Ошибка при выходе:', error);
    } finally {
      sessionMarker.value = null;
      user.value = null;
    }
  }

  return {
    user: readonly(user),
    roles,
    isLoggedIn,
    isAdmin,
    pending: readonly(pending),

    fetchProfile,
    restoreOnServer,
    restoreOnClient,
    signIn,
    signOut,
  };
}
