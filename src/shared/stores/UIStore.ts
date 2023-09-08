import { useCssVar, useScroll, useWindowSize } from '@vueuse/core';
import Cookies from 'js-cookie';
import localforage from 'localforage';
import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import {
  DB_NAME,
  FULLSCREEN_DB_KEY,
  THEME_DB_KEY
} from '@/shared/constants/UI';
import { errorHandler } from '@/shared/helpers/errorHandler';

export const useUIStore = defineStore('UIStore', () => {
  const theme = ref('');
  const fullscreen = ref(false);

  const bodyElement = ref<HTMLElement | null>(
    document.getElementById('container')
  );

  const bodyElementWatcher = setInterval(() => {
    bodyElement.value = document.getElementById('container');

    if (bodyElement.value) {
      clearInterval(bodyElementWatcher);
    }
  });

  const windowSize = useWindowSize();
  const bodyScroll = useScroll(bodyElement);

  const store = localforage.createInstance({
    name: DB_NAME,
    storeName: 'UI'
  });

  const isMobile = computed(() => windowSize.width.value < 1200);

  const getCookieTheme = () =>
    Cookies.get(THEME_DB_KEY) &&
    ['light', 'dark'].includes(<string>Cookies.get(THEME_DB_KEY))
      ? Cookies.get(THEME_DB_KEY)
      : 'dark';

  const removeOldTheme = async () => {
    try {
      await store.ready();

      const storageTheme =
        (await store.getItem(THEME_DB_KEY)) || localStorage.getItem('theme');

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

  const updateHTMLDataset = (name: string) => {
    const html = document.querySelector('html');

    if (!html) {
      return;
    }

    html.dataset.theme = `theme-${name}`;
  };

  const updateThemeMeta = () => {
    let el: HTMLMetaElement | null = document.querySelector(
      'meta[name="theme-color"]'
    );

    if (!el) {
      el = document.createElement('meta');
    }

    el.name = 'theme-color';

    const color = useCssVar('--bg-main');

    el.setAttribute('content', color.value);

    document.getElementsByTagName('head')[0].appendChild(el);
  };

  const setTheme = ({ name = '', avoidHtmlUpdate = false }) => {
    const themeName = name || 'dark';

    theme.value = themeName;

    Cookies.set(THEME_DB_KEY, themeName, {
      expires: 365
    });

    if (!avoidHtmlUpdate) {
      updateHTMLDataset(themeName);
    }

    updateThemeMeta();
  };

  const restoreFullscreenState = async () => {
    try {
      await store.ready();

      fullscreen.value =
        (await store.getItem<boolean>(FULLSCREEN_DB_KEY)) || false;

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
      document.documentElement.style.setProperty('--max-vh', `${value}px`);
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
    restoreFullscreenState,
    updateFullscreen,
    toggleFullscreen
  };
});
