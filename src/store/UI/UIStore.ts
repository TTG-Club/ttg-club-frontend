import { defineStore } from 'pinia';
import localforage from 'localforage';
import Cookies from 'js-cookie';
import {
    computed, ref, watch
} from 'vue';
import { useScroll, useWindowSize } from '@vueuse/core';
import {
    DB_NAME, FULLSCREEN_DB_KEY, THEME_DB_KEY
} from '@/common/const/UI';
import errorHandler from '@/common/helpers/errorHandler';

export const useUIStore = defineStore('UIStore', () => {
    const theme = ref('');
    const fullscreen = ref(false);
    const bodyElement = ref<HTMLElement | null>(document.getElementById('dnd5club'));

    const windowSize = useWindowSize();
    const bodyScroll = useScroll(bodyElement);

    const store = localforage.createInstance({
        name: DB_NAME,
        storeName: 'UI'
    });

    const isMobile = computed(() => windowSize.width.value < 1200);

    const getCookieTheme = () => (
        Cookies.get(THEME_DB_KEY) && ['light', 'dark'].includes(<string>Cookies.get(THEME_DB_KEY))
            ? Cookies.get(THEME_DB_KEY)
            : 'dark'
    );

    const removeOldTheme = async () => {
        try {
            await store.ready();

            const storageTheme = await store.getItem(THEME_DB_KEY)
                || localStorage.getItem('theme');

            if (!storageTheme) {
                return Promise.resolve();
            }

            if (await store.getItem(THEME_DB_KEY)) {
                await store.removeItem(THEME_DB_KEY);
            }

            if (localStorage.getItem(THEME_DB_KEY)) {
                localStorage.removeItem(THEME_DB_KEY);
            }

            return Promise.resolve();
        } catch (err) {
            return Promise.reject(err);
        }
    };

    const setTheme = ({
        name = '',
        avoidHtmlUpdate = false
    }) => {
        const themeName = name || 'dark';

        theme.value = themeName;

        Cookies.set(
            THEME_DB_KEY,
            themeName,
            {
                expires: 365
            }
        );

        if (!avoidHtmlUpdate) {
            const html = document.querySelector('html');

            if (!html) {
                return;
            }

            html.dataset.theme = `theme-${ themeName }`;
        }
    };

    const setFullscreenState = async (payload: boolean) => {
        try {
            await store.ready();

            let state = payload || false;

            const storageState = await store.getItem(FULLSCREEN_DB_KEY);

            if (typeof storageState === 'boolean') {
                state = storageState;
            }

            fullscreen.value = state;

            await store.setItem(FULLSCREEN_DB_KEY, state);

            return Promise.resolve();
        } catch (err) {
            errorHandler(err);

            return Promise.reject(err);
        }
    };

    const updateFullscreen = async (payload: boolean) => {
        try {
            await store.ready();
            await store.setItem(FULLSCREEN_DB_KEY, payload);

            fullscreen.value = payload;

            return Promise.resolve();
        } catch (err) {
            errorHandler(err);

            return Promise.reject(err);
        }
    };

    const toggleFullscreen = async () => {
        if (fullscreen.value) {
            await updateFullscreen(false);

            return;
        }

        await updateFullscreen(true);
    };

    watch(
        windowSize.height,
        value => {
            document.documentElement.style.setProperty('--max-vh', `${ value }px`);
        },
        {
            immediate: true
        }
    );

    return {
        theme,
        fullscreen,
        bodyElement,

        isMobile,
        windowSize,
        bodyScroll,

        getCookieTheme,
        removeOldTheme,
        setTheme,
        setFullscreenState,
        updateFullscreen,
        toggleFullscreen
    };
});
