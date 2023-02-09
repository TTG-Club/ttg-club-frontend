import { defineStore } from 'pinia';
import Cookies from 'js-cookie';
import { computed, ref } from 'vue';
import fromPairs from 'lodash/fromPairs';
import { useRoute } from 'vue-router';
import { USER_TOKEN_COOKIE } from '@/common/const/UI';
import { useAxios } from '@/common/composition/useAxios';
import { useIsDev } from '@/common/helpers/isDev';

export enum EUserRoles {
    USER = 'USER',
    WRITER = 'WRITER',
    SUBSCRIBER = 'SUBSCRIBER',
    MODERATOR = 'MODERATOR',
    ADMIN = 'ADMIN'
}

export enum EUserRolesRus {
    USER = 'пользователь',
    WRITER = 'писатель',
    SUBSCRIBER = 'подписчик',
    MODERATOR = 'модератор',
    ADMIN = 'администратор'
}

export type TUser = {
    username: string
    name: string
    email: string
    roles: EUserRoles[]
    avatar: string
}

export type TRegBody = {
    username: string
    password: string
    email: string
}

export type TAuthBody = {
    usernameOrEmail: string
    password: string
    remember: boolean
}

export type TChangePassBody = {
    userToken?: string
    resetToken?: string
    password: string
}

export const useUserStore = defineStore('UserStore', () => {
    const route = useRoute();
    const http = useAxios();
    const isDev = useIsDev();
    const user = ref<TUser | null>(null);
    const isAuthenticated = ref<boolean>(false);

    const roles = computed(() => {
        if (!user.value?.roles || !Array.isArray(user.value.roles)) {
            return [];
        }

        const entries = Object.entries(EUserRolesRus) as [EUserRoles, EUserRolesRus][];
        const availRoles: {[key in EUserRoles]?: EUserRolesRus} = fromPairs(entries);
        const { roles: userRoles } = user.value;

        const translated = userRoles
            .map(role => ({
                role,
                name: availRoles[role]
            }))
            .filter(role => !!role.name);

        if (!translated.length) {
            return [];
        }

        return translated;
    });

    const avatar = computed(() => ({
        src: user.value?.avatar || null,
        error: '/icon/avatar.png',
        loading: '/icon/avatar.png'
    }));

    const clearUser = () => {
        user.value = null;
        isAuthenticated.value = false;

        Cookies.remove(USER_TOKEN_COOKIE);

        if (route.name === 'personal-area') {
            window.location.href = '/';
        }
    };

    const getUserToken = () => Cookies.get(USER_TOKEN_COOKIE);

    const getUserInfo = async () => {
        try {
            const resp = await http.get({
                url: '/user/info'
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
        try {
            if (Object.values(body).find(item => !item)) {
                return Promise.reject(new Error('All fields are required to fill'));
            }

            const resp = await http.post({
                url: '/auth/signup',
                payload: body
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

    const authorization = async (body: TAuthBody) => {
        try {
            if (Object.values(body).find(item => typeof item === 'string' && !item)) {
                return Promise.reject(new Error('All fields are required to fill'));
            }

            const resp = await http.post({
                url: '/auth/signin',
                payload: body
            });

            switch (resp.status) {
                case 200:
                    if (isDev) {
                        Cookies.set(
                            USER_TOKEN_COOKIE,
                            resp.data.accessToken,
                            {
                                expires: 365
                            }
                        );
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
        }
    };

    const resetPassword = async (email: string) => {
        try {
            const resp = await http.get({
                url: '/auth/change/password',
                payload: { email }
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
        try {
            const resp = await http.post({
                url: '/auth/change/password',
                payload
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
                url: '/user/status'
            });

            if (resp.status !== 200 || !resp.data) {
                clearUser();

                return Promise.resolve(false);
            }

            isAuthenticated.value = true;

            return Promise.resolve(resp.data);
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
        logout
    };
});
