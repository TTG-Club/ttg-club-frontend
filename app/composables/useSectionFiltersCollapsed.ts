import type { ComputedRef } from 'vue';

import {
  SECTION_FILTERS_COLLAPSED_COOKIE,
  SECTION_LAYOUT_COOKIE_MAX_AGE_SECONDS,
} from '~/shared/consts';

export interface UseSectionFiltersCollapsedReturn {
  /** Фильтры строкой над списком, а не колонкой */
  isCollapsed: ComputedRef<boolean>;
  /** Фильтры над списком в широком режиме: так выбрано или узкая раскладка */
  isCollapsedInSplit: ComputedRef<boolean>;
  /** Ставит фильтры над списком или колонкой */
  setCollapsed: (value: boolean) => void;
}

/**
 * Где фильтры разделов в широком режиме: строкой над списком или колонкой
 * сбоку. Пока посетитель не выбирал — над списком, как было на этом сайте.
 * В cookie — чтобы сервер сразу отдал нужную раскладку.
 *
 * @returns Состояние фильтров и его переключатель
 */
export function useSectionFiltersCollapsed(): UseSectionFiltersCollapsedReturn {
  const { isSplitActive } = useLayoutWidth();
  const { isCentered } = useSectionCentered();

  const cookie = useCookie<unknown>(SECTION_FILTERS_COLLAPSED_COOKIE, {
    maxAge: SECTION_LAYOUT_COOKIE_MAX_AGE_SECONDS,
    default: () => undefined,
  });

  // В cookie может попасть что угодно — колонка только при явном `false`
  const isCollapsed = computed(() => cookie.value !== false);

  // В узкой раскладке колонки фильтров нет: они всегда строкой над списком
  const isCollapsedInSplit = computed(
    () => isSplitActive.value && (isCollapsed.value || isCentered.value),
  );

  return {
    isCollapsed,
    isCollapsedInSplit,
    setCollapsed: (value) => {
      cookie.value = value;
    },
  };
}
