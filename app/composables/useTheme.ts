import type { ThemeMode } from '#shared/consts';

import {
  THEME_COOKIE,
  THEME_COOKIE_MAX_AGE_SECONDS,
  THEME_MODES,
} from '#shared/consts';

const THEME_MODE_SET: ReadonlySet<string> = new Set(THEME_MODES);

/**
 * Проверяет, что значение из cookie — известный режим темы.
 *
 * @param value - Значение cookie
 * @returns `true`, если это режим темы
 */
function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && THEME_MODE_SET.has(value);
}

/**
 * Тема сайта из общей со старым SPA cookie.
 *
 * Класс темы на `<html>` ставится ещё на сервере, поэтому страница не мигает.
 * В режиме `auto` класса нет и действует системная тема (см. `theme.css`).
 *
 * @returns Текущий режим, класс для `<html>` и смена режима
 */
export function useTheme() {
  const cookie = useCookie<string>(THEME_COOKIE, {
    maxAge: THEME_COOKIE_MAX_AGE_SECONDS,
    default: () => 'auto',
  });

  const mode = computed<ThemeMode>(() =>
    isThemeMode(cookie.value) ? cookie.value : 'auto',
  );

  const htmlClass = computed(() => (mode.value === 'auto' ? '' : mode.value));

  function change(nextMode: ThemeMode) {
    cookie.value = nextMode;
  }

  return {
    mode,
    htmlClass,
    change,
  };
}
