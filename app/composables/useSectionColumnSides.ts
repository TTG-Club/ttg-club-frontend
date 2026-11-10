import type { ComputedRef } from 'vue';
import type { SectionColumnSide } from '~/shared/consts';

import {
  SECTION_DETAIL_SIDE_COOKIE,
  SECTION_FILTERS_SIDE_COOKIE,
  SECTION_LAYOUT_COOKIE_MAX_AGE_SECONDS,
} from '~/shared/consts';

export interface UseSectionColumnSidesReturn {
  /** С какой стороны колонка фильтров */
  filtersSide: ComputedRef<SectionColumnSide>;
  /** С какой стороны от списка запись */
  detailSide: ComputedRef<SectionColumnSide>;
  /** Переставляет колонку фильтров */
  setFiltersSide: (side: SectionColumnSide) => void;
  /** Переставляет запись */
  setDetailSide: (side: SectionColumnSide) => void;
}

/**
 * Читает сторону из cookie: всё, кроме известного значения, — сторона по
 * умолчанию.
 *
 * @param value - Значение cookie
 * @param fallback - Сторона по умолчанию
 * @returns Сторона колонки
 */
function toSide(
  value: unknown,
  fallback: SectionColumnSide,
): SectionColumnSide {
  return value === 'left' || value === 'right' ? value : fallback;
}

/**
 * Порядок колонок широкого режима, как на new.ttg.club: фильтры слева или
 * справа, запись справа или слева от списка. Один на все разделы. В cookie —
 * чтобы сервер сразу отдал колонки по местам.
 *
 * @returns Стороны колонок и их смена
 */
export function useSectionColumnSides(): UseSectionColumnSidesReturn {
  const cookieOptions = {
    maxAge: SECTION_LAYOUT_COOKIE_MAX_AGE_SECONDS,
    default: () => undefined,
  };

  const filtersCookie = useCookie<unknown>(
    SECTION_FILTERS_SIDE_COOKIE,
    cookieOptions,
  );

  const detailCookie = useCookie<unknown>(
    SECTION_DETAIL_SIDE_COOKIE,
    cookieOptions,
  );

  const filtersSide = computed(() => toSide(filtersCookie.value, 'left'));
  const detailSide = computed(() => toSide(detailCookie.value, 'right'));

  return {
    filtersSide,
    detailSide,
    setFiltersSide: (side) => {
      filtersCookie.value = side;
    },
    setDetailSide: (side) => {
      detailCookie.value = side;
    },
  };
}
