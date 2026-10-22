import type { LayoutWidth } from '~/shared/consts';

import {
  LAYOUT_DRAWER_QUERY,
  LAYOUT_SPLIT_QUERY,
  LAYOUT_WIDTH_COOKIE,
  LAYOUT_WIDTH_COOKIE_MAX_AGE_SECONDS,
  LAYOUT_WIDTH_DEFAULT,
  LAYOUT_WIDTHS,
} from '~/shared/consts';

const LAYOUT_WIDTH_SET: ReadonlySet<string> = new Set(LAYOUT_WIDTHS);

/**
 * Проверяет, что значение из cookie — известная ширина.
 *
 * @param value - Значение cookie
 * @returns `true`, если это ширина раздела
 */
function isLayoutWidth(value: unknown): value is LayoutWidth {
  return typeof value === 'string' && LAYOUT_WIDTH_SET.has(value);
}

/**
 * Ширина разделов, как на new.ttg.club: в обычной карточка записи
 * открывается дровером, в широкой стоит рядом со списком.
 *
 * Сервер не знает ширину экрана и решает по устройству из User-Agent,
 * браузер — по медиазапросу.
 *
 * @returns Выбранная ширина, режимы раскладки и смена ширины
 */
export function useLayoutWidth() {
  const cookie = useCookie<string>(LAYOUT_WIDTH_COOKIE, {
    maxAge: LAYOUT_WIDTH_COOKIE_MAX_AGE_SECONDS,
    default: () => LAYOUT_WIDTH_DEFAULT,
  });

  const { isMobile, isMobileOrTablet } = useDevice();

  const isSplitScreen = useMediaQuery(LAYOUT_SPLIT_QUERY, {
    ssrWidth: isMobileOrTablet ? 0 : Infinity,
  });

  const isDrawerScreen = useMediaQuery(LAYOUT_DRAWER_QUERY, {
    ssrWidth: isMobile ? 0 : Infinity,
  });

  const width = computed<LayoutWidth>(() =>
    isLayoutWidth(cookie.value) ? cookie.value : LAYOUT_WIDTH_DEFAULT,
  );

  /** Список и карточка рядом: широкая ширина на большом экране. */
  const isSplitActive = computed(
    () => width.value === 'wide' && isSplitScreen.value,
  );

  /** На телефоне карточка открывается своей страницей. */
  const isDrawerAvailable = computed(() => isDrawerScreen.value);

  function change(next: LayoutWidth) {
    cookie.value = next;
  }

  return { width, isSplitActive, isDrawerAvailable, change };
}
