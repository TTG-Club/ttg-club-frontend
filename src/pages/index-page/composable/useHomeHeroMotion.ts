import { HOME_HERO_MOTION_QUERY, HOME_HERO_MOTION_STORAGE_KEY } from '../model';

import type { HomeHeroMotionState } from '../model';

type HomeHeroMotion = {
  /** Что сейчас с повозкой и дымом */
  state: ComputedRef<HomeHeroMotionState>;
  /** Устройство вообще получает анимацию — только тогда видна кнопка */
  isSupported: Ref<boolean>;
  /** Посетитель не выключал анимацию (выбор хранится в localStorage) */
  isEnabled: Ref<boolean>;
  /** Шапка на экране — от этого зависят и другие её анимации */
  isVisible: Ref<boolean>;
  /** Кнопка в углу шапки: выключает или включает анимацию и запоминает выбор */
  toggle: () => void;
};

/**
 * Состояние живого фона шапки — повозки и дыма на карте.
 *
 * Анимация есть только на устройствах с мышью и без системной просьбы «меньше
 * движения»; на телефонах и планшетах её нет совсем. По умолчанию она
 * включена, выключенная кнопкой — остаётся выключенной и после перезагрузки.
 * Пока шапка за экраном, анимация стоит.
 *
 * Выключенная кнопкой анимация замирает на месте, как видео на паузе. Если же
 * посетитель выключил её раньше, на странице она и не начинается: повозка
 * стоит на своём месте на дороге, дыма нет.
 *
 * @param hero - шапка главной, по ней видно, на экране ли фон
 */
export function useHomeHeroMotion(
  hero: Ref<HTMLElement | undefined>,
): HomeHeroMotion {
  const isSupported = useMediaQuery(HOME_HERO_MOTION_QUERY);
  const isEnabled = useLocalStorage(HOME_HERO_MOTION_STORAGE_KEY, true);
  const isVisible = useElementVisibility(hero);

  /** Анимация уже шла на этой странице — выключение её только замораживает */
  const hasPlayed = ref(false);

  watchImmediate([isSupported, isEnabled], ([supported, enabled]) => {
    if (supported && enabled) {
      hasPlayed.value = true;
    }
  });

  const state = computed<HomeHeroMotionState>(() => {
    if (!isSupported.value || (!isEnabled.value && !hasPlayed.value)) {
      return 'static';
    }

    return isEnabled.value && isVisible.value ? 'running' : 'paused';
  });

  function toggle(): void {
    isEnabled.value = !isEnabled.value;
  }

  return { state, isSupported, isEnabled, isVisible, toggle };
}
