import type { ComputedRef } from 'vue';

import {
  SECTION_CENTERED_COOKIE,
  SECTION_LAYOUT_COOKIE_MAX_AGE_SECONDS,
} from '~/shared/consts';

export interface UseSectionCenteredReturn {
  /** Выбрана узкая раскладка с записью рядом */
  isCentered: ComputedRef<boolean>;
  /** Узкая раскладка действует: выбрана и сейчас широкий режим */
  isCenteredInSplit: ComputedRef<boolean>;
  /** Включает или выключает узкую раскладку */
  setCentered: (value: boolean) => void;
}

/**
 * Узкая раскладка разделов, как в старом SPA: страница стоит колонкой по
 * центру, пока запись не открыта — список во всю её ширину, с записью —
 * список слева, запись справа на том же месте. Работает поверх широкого
 * режима: запись так же хранится в `?detail=`. В cookie — чтобы сервер
 * сразу отдал нужную раскладку.
 *
 * @returns Состояние раскладки и его переключатель
 */
export function useSectionCentered(): UseSectionCenteredReturn {
  const { isSplitActive } = useLayoutWidth();

  const cookie = useCookie<unknown>(SECTION_CENTERED_COOKIE, {
    maxAge: SECTION_LAYOUT_COOKIE_MAX_AGE_SECONDS,
    default: () => false,
  });

  // В cookie может попасть что угодно — включено только явное `true`
  const isCentered = computed(() => cookie.value === true);

  const isCenteredInSplit = computed(
    () => isSplitActive.value && isCentered.value,
  );

  return {
    isCentered,
    isCenteredInSplit,
    setCentered: (value) => {
      cookie.value = value;
    },
  };
}
