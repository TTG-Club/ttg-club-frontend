import type { MaybeRefOrGetter, StyleValue } from 'vue';

import { promiseTimeout } from '@vueuse/core';

import {
  SECTION_SWIPE_AXIS_RATIO,
  SECTION_SWIPE_DEADZONE,
  SECTION_SWIPE_DURATION_MS,
  SECTION_SWIPE_ENTER_SHIFT,
  SECTION_SWIPE_FADE_SPAN,
  SECTION_SWIPE_MAX_FADE,
  SECTION_SWIPE_RESISTANCE,
  SECTION_SWIPE_THRESHOLD,
} from '../model';

/**
 * Записи списка раздела в том порядке, в каком их видно на экране. Список
 * сохраняет их, когда на телефоне запись открывается своей страницей, чтобы
 * со страницы записи листать соседние.
 * @param sectionKey - ключ раздела
 */
export function useSectionPaths(sectionKey: string) {
  return useState<Array<string>>(`section-paths-${sectionKey}`, () => []);
}

/**
 * Проверяет, начался ли жест в блоке с прокруткой вбок, например в широкой
 * таблице: там палец листает таблицу, а не записи.
 * @param target - элемент под пальцем
 * @param root - страница записи
 */
function isInsideScrollX(target: EventTarget | null, root: Element) {
  let element = target instanceof Element ? target : null;

  while (element && element !== root) {
    if (element.scrollWidth > element.clientWidth) {
      const { overflowX } = getComputedStyle(element);

      if (overflowX === 'auto' || overflowX === 'scroll') {
        return true;
      }
    }

    element = element.parentElement;
  }

  return false;
}

/** Поднимает запись под палец: сдвиг без перехода, как ведёт палец. */
const SWIPE_DRAG_TRANSITION = 'none';

/** Доигрывает сдвиг и затухание записи переходом. */
const SWIPE_SETTLE_TRANSITION = `left ${SECTION_SWIPE_DURATION_MS}ms ease-out, opacity ${SECTION_SWIPE_DURATION_MS}ms ease-out`;

/** Ждёт следующий кадр отрисовки. */
function waitForFrame(): Promise<number> {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

/**
 * Листание записей свайпом на странице записи на телефоне:
 * влево — следующая запись списка, вправо — предыдущая. Работает, только
 * если пришли из списка раздела, или если запись сама задала, что листать,
 * как архетип — архетипы своего класса; переход заменяет запись в истории,
 * и «назад» возвращает к списку.
 *
 * Запись идёт за пальцем и гаснет, отпущенная — уезжает в сторону жеста,
 * а новая въезжает с другой стороны. Где листать некуда, запись лишь
 * чуть отходит и возвращается. Без анимации, если система просит меньше
 * движения.
 * @param sectionKey - ключ раздела
 * @param target - страница записи
 * @param path - адрес открытой записи
 * @param ownPaths - что листать вместо списка раздела, если запись это задала
 * @returns стиль сдвига записи
 */
export function useSectionSwipe(
  sectionKey: string,
  target: MaybeRefOrGetter<Element | null | undefined>,
  path: MaybeRefOrGetter<string>,
  ownPaths?: MaybeRefOrGetter<Array<string> | undefined>,
) {
  const sectionPaths = useSectionPaths(sectionKey);

  const paths = computed(() => toValue(ownPaths) ?? sectionPaths.value);
  const preferredMotion = usePreferredReducedMotion();

  // Сторона, с которой въезжает следующая запись: страница записи при
  // переходе создаётся заново, поэтому сторона живёт в общем состоянии
  const enterSide = useState<number | undefined>(
    `section-swipe-enter-${sectionKey}`,
    () => undefined,
  );

  const index = computed(() => paths.value.indexOf(toValue(path)));

  const previousPath = computed(() =>
    index.value > 0 ? paths.value[index.value - 1] : undefined,
  );

  const nextPath = computed(() =>
    index.value === -1 ? undefined : paths.value[index.value + 1],
  );

  const isAnimated = computed(() => preferredMotion.value !== 'reduce');

  const offset = ref(0);
  const opacity = ref(1);
  const transition = ref(SWIPE_DRAG_TRANSITION);

  // Стиль держится, пока запись не вернулась на место: иначе возврат
  // снимал бы стиль сразу и переход не доигрывался
  const isMoving = ref(false);

  // Сдвиг через left, а не transform: transform делает запись блоком
  // отсчёта для кнопок записи с position: fixed, и они уезжали бы с ней
  const style = computed<StyleValue | undefined>(() =>
    isMoving.value
      ? {
          position: 'relative',
          left: `${offset.value}px`,
          opacity: opacity.value,
          transition: transition.value,
        }
      : undefined,
  );

  // Без этого Chrome на Android сам уводит свайпом вправо назад в историю
  useHead({
    htmlAttrs: {
      class: computed(() =>
        index.value === -1 || !toValue(target)
          ? undefined
          : 'overscroll-x-none',
      ),
    },
  });

  /**
   * Куда ведёт жест.
   * @param shift - сдвиг пальца: меньше нуля — палец идёт влево
   */
  function getDestination(shift: number): string | undefined {
    return shift < 0 ? nextPath.value : previousPath.value;
  }

  /** Ширина записи: от неё считаются уход и затухание. */
  function getWidth(): number {
    return toValue(target)?.clientWidth ?? 0;
  }

  /**
   * Ведёт запись за пальцем: она отъезжает в сторону жеста и гаснет.
   * @param shift - сдвиг пальца: меньше нуля — палец идёт влево
   */
  function drag(shift: number): void {
    const width = getWidth();
    const distance = Math.min(Math.abs(shift) - SECTION_SWIPE_DEADZONE, width);

    if (width <= 0 || distance <= 0) {
      offset.value = 0;
      opacity.value = 1;

      return;
    }

    const hasDestination = !!getDestination(shift);
    const progress = Math.min(1, distance / (width * SECTION_SWIPE_FADE_SPAN));

    isMoving.value = true;
    transition.value = SWIPE_DRAG_TRANSITION;

    offset.value =
      Math.sign(shift)
      * distance
      * (hasDestination ? 1 : SECTION_SWIPE_RESISTANCE);

    opacity.value = hasDestination ? 1 - progress * SECTION_SWIPE_MAX_FADE : 1;
  }

  /** Возвращает запись на место и снимает стиль, когда переход доиграл. */
  async function settle(): Promise<void> {
    if (!isMoving.value) {
      return;
    }

    transition.value = SWIPE_SETTLE_TRANSITION;
    offset.value = 0;
    opacity.value = 1;

    await promiseTimeout(SECTION_SWIPE_DURATION_MS);

    // За время перехода палец мог снова взять запись
    if (!offset.value) {
      isMoving.value = false;
    }
  }

  /**
   * Уводит запись в сторону жеста и открывает соседнюю.
   * @param destination - адрес соседней записи
   * @param shift - сдвиг пальца: меньше нуля — палец идёт влево
   */
  async function leave(destination: string, shift: number): Promise<void> {
    const side = Math.sign(shift);

    if (isAnimated.value) {
      transition.value = SWIPE_SETTLE_TRANSITION;
      offset.value = side * getWidth();
      opacity.value = 0;
      enterSide.value = -side;

      await promiseTimeout(SECTION_SWIPE_DURATION_MS);
    }

    await navigateTo(destination, { replace: true });
  }

  /** Новая запись въезжает с той стороны, откуда её вытянул палец. */
  async function enter(): Promise<void> {
    const side = enterSide.value;

    enterSide.value = undefined;

    if (!side || !isAnimated.value) {
      return;
    }

    isMoving.value = true;
    transition.value = SWIPE_DRAG_TRANSITION;
    offset.value = side * getWidth() * SECTION_SWIPE_ENTER_SHIFT;
    opacity.value = 0;

    // Два кадра: первый рисует начальное положение, со второго идёт переход
    await waitForFrame();
    await waitForFrame();

    await settle();
  }

  let isBlocked = false;
  let isHorizontal: boolean | undefined;

  const { lengthX, lengthY } = useSwipe(target, {
    threshold: SECTION_SWIPE_DEADZONE,
    onSwipeStart(event) {
      const root = toValue(target);

      isBlocked = !root || isInsideScrollX(event.target, root);
      isHorizontal = undefined;
    },
    onSwipe() {
      // Ось выбирается один раз на первых пикселях: вертикальный жест —
      // прокрутка страницы, и запись под ним не двигается
      isHorizontal ??=
        Math.abs(lengthX.value)
        >= Math.abs(lengthY.value) * SECTION_SWIPE_AXIS_RATIO;

      if (!isBlocked && isHorizontal && isAnimated.value) {
        drag(-lengthX.value);
      }
    },
    onSwipeEnd() {
      const shift = -lengthX.value;

      const destination =
        !isBlocked && isHorizontal && Math.abs(shift) >= SECTION_SWIPE_THRESHOLD
          ? getDestination(shift)
          : undefined;

      if (destination) {
        void leave(destination, shift);
      } else {
        void settle();
      }
    },
  });

  onMounted(enter);

  return { style };
}
