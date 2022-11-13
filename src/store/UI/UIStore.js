import { defineStore } from 'pinia';
import localforage from 'localforage';
import Cookies from 'js-cookie';
import {
    DB_NAME, FULLSCREEN_DB_KEY, THEME_DB_KEY
} from '@/common/const/UI';
import errorHandler from '@/common/helpers/errorHandler';

export const useUIStore = defineStore('UIStore', {
    state: () => ({
        theme: '',
        fullscreen: false,
        windowSize: {
            height: 0,
            width: 0
        },
        store: localforage.createInstance({
            name: DB_NAME,
            storeName: 'UI'
        })
    }),

    getters: {
        isMobile: state => state.windowSize.width < 1200
    },

    actions: {
        async removeOldTheme() {
            try {
                await this.store.ready();

                const storageTheme = await this.store.getItem(THEME_DB_KEY)
                    || localStorage.getItem('theme');

                if (!storageTheme) {
                    return Promise.resolve();
                }

                if (await this.store.getItem(THEME_DB_KEY)) {
                    await this.store.removeItem(THEME_DB_KEY);
                }

                if (localStorage.getItem(THEME_DB_KEY)) {
                    localStorage.removeItem(THEME_DB_KEY);
                }

                return Promise.resolve();
            } catch (err) {
                return Promise.reject(err);
            }
        },

        getCookieTheme() {
            return Cookies.get(THEME_DB_KEY) && ['light', 'dark'].includes(Cookies.get(THEME_DB_KEY))
                ? Cookies.get(THEME_DB_KEY)
                : 'dark';
        },

        setTheme({
            name = '',
            avoidHtmlUpdate = false
        }) {
            const themeName = name || 'dark';

            this.theme = themeName;

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
        },

        async setFullscreenState(payload) {
            try {
                await this.store.ready();

                let fullscreen = payload || false;

                const storageState = await this.store.getItem(FULLSCREEN_DB_KEY);

                if (typeof payload !== 'boolean' && typeof storageState === 'boolean') {
                    fullscreen = storageState;
                }

                this.fullscreen = fullscreen;

                await this.store.setItem(FULLSCREEN_DB_KEY, fullscreen);
            } catch (err) {
                errorHandler(err);
            }
        },

        watchWindowSize() {
            const updateCallback = () => {
                const size = {
                    width: window.innerWidth,
                    height: window.innerHeight
                };

                document.documentElement.style.setProperty('--max-vh', `${ size.height }px`);

                this.windowSize = size;
            };

            updateCallback();

            window.addEventListener('resize', updateCallback);
        }
    }
});
