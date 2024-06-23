import Cookies from 'js-cookie';

import { FULLSCREEN_DB_KEY, THEME_DB_KEY } from '@/shared/const/UI';

export const useUIStore = defineStore('UIStore', () => {
  const updateThemeMeta = () => {
    let el: HTMLMetaElement | null = document.querySelector(
      'meta[name="theme-color"]',
    );

    if (!el) {
      el = document.createElement('meta');
    }

    el.name = 'theme-color';

    const color = useCssVar('--bg-main');

    el.setAttribute('content', color.value);

    document.getElementsByTagName('head')[0].appendChild(el);
  };

  const { store: storedTheme, system: systemTheme } = useColorMode({
    storageKey: null,
    initialValue: Cookies.get(THEME_DB_KEY) || 'auto',
    onChanged(mode, defaultHandler) {
      defaultHandler(mode);
      updateThemeMeta();

      Cookies.set(THEME_DB_KEY, mode, {
        expires: 365,
      });
    },
  });

  const theme = computed({
    get: () =>
      storedTheme.value === 'auto' ? systemTheme.value : storedTheme.value,
    set: (value) => {
      storedTheme.value = value;
    },
  });

  const bodyElement = ref<HTMLElement | null>(
    document.getElementById('container'),
  );

  const windowSize = useWindowSize();
  const bodyScroll = useScroll(bodyElement);
  const isMobile = computed(() => windowSize.width.value < 1200);
  const fullscreen = useStorage(FULLSCREEN_DB_KEY, false, localStorage);

  const bodyElementWatcher = setInterval(() => {
    bodyElement.value = document.getElementById('container');

    if (bodyElement.value) {
      clearInterval(bodyElementWatcher);
    }
  });

  watch(
    windowSize.height,
    (value) => {
      document.documentElement.style.setProperty('--max-vh', `${value}px`);
    },
    {
      immediate: true,
    },
  );

  return {
    theme,
    storedTheme,
    fullscreen,
    bodyElement,

    isMobile,
    windowSize,
    bodyScroll,
  };
});
