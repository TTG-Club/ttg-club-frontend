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
import { autoDetectTheme } from '@/shared/helpers/autoDetectTheme';
import { errorHandler } from '@/shared/helpers/errorHandler';
import { ThemePreference } from '@/shared/types/Theme';

export const useUIStore = defineStore('UIStore', () => {
  const theme = ref('');
  const themePreference = ref('');
  const fullscreen = ref(false);

  let unsubscribe: any = null;

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
    [
      ThemePreference.auto,
      ThemePreference.light,
      ThemePreference.dark
    ].includes(<ThemePreference>Cookies.get(THEME_DB_KEY))
      ? Cookies.get(THEME_DB_KEY)
      : ThemePreference.dark;

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

  const setTheme = ({
    name,
    avoidHtmlUpdate = false
  }: {
    name: ThemePreference;
    avoidHtmlUpdate?: boolean;
  }) => {
    theme.value = name;

    if (!avoidHtmlUpdate) {
      updateHTMLDataset(name);
    }

    updateThemeMeta();
  };

  const listenSystemAppearance = (event: MediaQueryListEvent) =>
    setTheme({
      name: event.matches ? ThemePreference.dark : ThemePreference.light
    });

  const setThemePreference = (
    preference: ThemePreference,
    avoidHtmlUpdate = false
  ) => {
    themePreference.value = preference || ThemePreference.dark;

    Cookies.set(THEME_DB_KEY, themePreference.value, {
      expires: 365
    });

    if (themePreference.value === ThemePreference.auto) {
      unsubscribe = autoDetectTheme(
        (value: ThemePreference) => setTheme({ name: value, avoidHtmlUpdate }),
        listenSystemAppearance
      );

      return;
    }

    if (unsubscribe) {
      unsubscribe = unsubscribe();
    }

    setTheme({ name: preference, avoidHtmlUpdate });
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
    themePreference,
    fullscreen,
    bodyElement,

    isMobile,
    windowSize,
    bodyScroll,

    getCookieTheme,
    removeOldTheme,
    setTheme,
    setThemePreference,
    restoreFullscreenState,
    updateFullscreen,
    toggleFullscreen
  };
});
