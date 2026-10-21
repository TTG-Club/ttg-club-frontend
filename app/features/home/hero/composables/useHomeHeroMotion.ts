import type { ComputedRef, MaybeRefOrGetter } from 'vue';

import type { HomeHeroMotionState } from '../model';

import { HOME_HERO_MOTION_QUERY, HOME_HERO_MOTION_STORAGE_KEY } from '../model';

interface HomeHeroMotion {
  /** Что сейчас с повозкой и дымом */
  state: ComputedRef<HomeHeroMotionState>;
  /** Устройство вообще получает анимацию — только тогда видна кнопка */
  isSupported: ComputedRef<boolean>;
  /** Посетитель не выключал анимацию (выбор хранится в localStorage) */
  isEnabled: Readonly<Ref<boolean>>;
  /** Шапка на экране — от этого зависят и другие её анимации */
  isVisible: Readonly<Ref<boolean>>;
  /** Кнопка в углу шапки: выключает или включает анимацию и запоминает выбор */
  toggle: () => void;
}

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
 * Сервер не знает ни устройство, ни выбор посетителя, поэтому до монтирования
 * фон статичен и на сервере, и на клиенте — гидратация не спорит сама с собой.
 * Выбор посетителя читается из localStorage тоже только после монтирования.
 *
 * @param hero - шапка главной, по ней видно, на экране ли фон
 * @returns состояние анимации и переключатель для кнопки
 */
export function useHomeHeroMotion(
  hero: MaybeRefOrGetter<HTMLElement | null>,
): HomeHeroMotion {
  const isEnabled = useLocalStorage(HOME_HERO_MOTION_STORAGE_KEY, true, {
    initOnMounted: true,
  });

  const isMounted = useMounted();
  const isMotionQueryMatched = useMediaQuery(HOME_HERO_MOTION_QUERY);

  const isSupported = computed(
    () => isMounted.value && isMotionQueryMatched.value,
  );

  // Шапка стоит вверху страницы, поэтому до первого ответа наблюдателя
  // считаем её видимой: свет по рамке поиска идёт уже с серверной разметки
  const isVisible = useElementVisibility(hero, { initialValue: true });

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

  /** Выключает или включает анимацию; выбор сам уходит в localStorage. */
  function toggle(): void {
    isEnabled.value = !isEnabled.value;
  }

  return {
    state,
    isSupported,
    isEnabled: readonly(isEnabled),
    isVisible: readonly(isVisible),
    toggle,
  };
}
