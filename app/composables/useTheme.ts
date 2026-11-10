import type { ThemeMode } from '#shared/consts';
import type {
  CustomThemeBase,
  CustomThemePalette,
  CustomThemeSettings,
} from '~infrastructure/custom-theme/model';

import {
  CUSTOM_THEME_COOKIE,
  DEFAULT_THEME_MODE,
  THEME_COOKIE,
  THEME_COOKIE_MAX_AGE_SECONDS,
  THEME_MODES,
} from '#shared/consts';
import {
  createCustomThemePalette,
  CUSTOM_THEME_CLASS,
  CUSTOM_THEME_DEFAULT_SETTINGS,
  getCustomThemeBase,
  parseCustomThemeSettings,
  renderCustomThemeCss,
} from '~infrastructure/custom-theme/model';

const THEME_MODE_SET: ReadonlySet<string> = new Set(THEME_MODES);

/**
 * Последняя посчитанная палитра своей темы в браузере. При перетаскивании
 * ползунка настройки меняются часто — палитра по одним и тем же настройкам
 * считается один раз.
 */
let cachedPalette: { key: string; palette: CustomThemePalette } | undefined;

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
 * Палитра своей темы с кэшем последнего результата.
 *
 * @param settings - Настройки темы
 * @returns Палитра
 */
function getCustomThemePalette(
  settings: CustomThemeSettings,
): CustomThemePalette {
  // На сервере кэш был бы общим для всех запросов — настройки посетителя
  // в нём не держим, палитра считается заново
  if (import.meta.server) {
    return createCustomThemePalette(settings);
  }

  const key = JSON.stringify(settings);

  if (cachedPalette?.key !== key) {
    cachedPalette = { key, palette: createCustomThemePalette(settings) };
  }

  return cachedPalette.palette;
}

/**
 * Тема сайта из cookie: готовая (тёмная, светлая, svifty7) или своя,
 * собранная из настроек посетителя, как на new.ttg.club. Без выбора и при
 * неизвестном значении — тёмная.
 *
 * Класс темы на `<html>` и переменные своей темы ставятся ещё на сервере,
 * поэтому страница не мигает.
 *
 * @returns Текущий режим, класс для `<html>`, CSS своей темы и их смена
 */
export function useTheme() {
  const cookie = useCookie<string>(THEME_COOKIE, {
    maxAge: THEME_COOKIE_MAX_AGE_SECONDS,
    default: () => DEFAULT_THEME_MODE,
  });

  const customSettingsCookie = useCookie<unknown>(CUSTOM_THEME_COOKIE, {
    maxAge: THEME_COOKIE_MAX_AGE_SECONDS,
    default: () => CUSTOM_THEME_DEFAULT_SETTINGS,
  });

  const mode = computed<ThemeMode>(() =>
    isThemeMode(cookie.value) ? cookie.value : DEFAULT_THEME_MODE,
  );

  // Настройки читаются из общего состояния, а cookie только сохраняет их.
  // Браузер сообщает об изменении cookie с опозданием: пока тянут ползунок,
  // приходят уже устаревшие значения, и чтение из cookie отбрасывало бегунок
  // назад. Значение из cookie приходит извне — проверяется схемой
  const customSettings = useState(CUSTOM_THEME_COOKIE, () =>
    parseCustomThemeSettings(customSettingsCookie.value),
  );

  const isCustom = computed(() => mode.value === 'custom');

  const customPalette = computed(() =>
    isCustom.value ? getCustomThemePalette(customSettings.value) : undefined,
  );

  /** Основа своей темы: тёмная или светлая палитра под её переменными. */
  const customBase = computed<CustomThemeBase>(() =>
    getCustomThemeBase(customSettings.value.background),
  );

  const htmlClass = computed(() => {
    if (isCustom.value) {
      return `${customBase.value} ${CUSTOM_THEME_CLASS}`;
    }

    return mode.value;
  });

  /** CSS с переменными своей темы; у готовых тем пусто. */
  const customCss = computed(() =>
    customPalette.value ? renderCustomThemeCss(customPalette.value) : '',
  );

  /**
   * Переключает тему.
   *
   * @param nextMode - Режим темы
   */
  function change(nextMode: ThemeMode) {
    cookie.value = nextMode;
  }

  /**
   * Меняет часть настроек своей темы, остальные оставляет как были.
   *
   * @param patch - Изменённые настройки
   */
  function changeCustomSettings(patch: Partial<CustomThemeSettings>) {
    customSettings.value = { ...customSettings.value, ...patch };
    customSettingsCookie.value = customSettings.value;
  }

  /** Возвращает своей теме настройки по умолчанию. */
  function resetCustomSettings() {
    customSettings.value = CUSTOM_THEME_DEFAULT_SETTINGS;
    customSettingsCookie.value = CUSTOM_THEME_DEFAULT_SETTINGS;
  }

  return {
    mode,
    htmlClass,
    customCss,
    customSettings,
    customPalette,
    change,
    changeCustomSettings,
    resetCustomSettings,
  };
}
