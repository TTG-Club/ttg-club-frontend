import type { MaybeRefOrGetter } from 'vue';

import { SECTION_SWIPE_AXIS_RATIO, SECTION_SWIPE_THRESHOLD } from '../model';

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

/**
 * Листание записей свайпом на странице записи на телефоне:
 * влево — следующая запись списка, вправо — предыдущая. Работает, только
 * если пришли из списка раздела; переход заменяет запись в истории, и
 * «назад» возвращает к списку.
 * @param sectionKey - ключ раздела
 * @param target - страница записи
 * @param path - адрес открытой записи
 */
export function useSectionSwipe(
  sectionKey: string,
  target: MaybeRefOrGetter<Element | null | undefined>,
  path: MaybeRefOrGetter<string>,
) {
  const paths = useSectionPaths(sectionKey);

  const index = computed(() => paths.value.indexOf(toValue(path)));

  const previousPath = computed(() =>
    index.value > 0 ? paths.value[index.value - 1] : undefined,
  );

  const nextPath = computed(() =>
    index.value === -1 ? undefined : paths.value[index.value + 1],
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

  let isBlocked = false;

  const { lengthX, lengthY } = useSwipe(target, {
    threshold: SECTION_SWIPE_THRESHOLD,
    onSwipeStart(event) {
      const root = toValue(target);

      isBlocked = !root || isInsideScrollX(event.target, root);
    },
    onSwipeEnd(_event, direction) {
      if (
        isBlocked
        || Math.abs(lengthX.value)
          < Math.abs(lengthY.value) * SECTION_SWIPE_AXIS_RATIO
      ) {
        return;
      }

      const destination = {
        left: nextPath.value,
        right: previousPath.value,
        up: undefined,
        down: undefined,
        none: undefined,
      }[direction];

      if (destination) {
        navigateTo(destination, { replace: true });
      }
    },
  });
}
