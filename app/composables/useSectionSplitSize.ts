import type { ComputedRef, MaybeRefOrGetter } from 'vue';

import { toValue } from 'vue';

import {
  SECTION_LAYOUT_COOKIE_MAX_AGE_SECONDS,
  SECTION_SPLIT_SIZES_COOKIE,
} from '~/shared/consts';

/** Сколько ждать конца перетаскивания, прежде чем записать ширину, в мс. */
const SPLIT_SIZE_SAVE_DELAY = 300;

/** Ширина хранится с точностью до десятой доли процента. */
const SPLIT_SIZE_PRECISION = 10;

export interface UseSectionSplitSizeReturn {
  /** Запомненная ширина, в процентах; нет — не меняли */
  size: ComputedRef<number | undefined>;
  /** Запоминает ширину (с задержкой: при перетаскивании она меняется непрерывно) */
  saveSize: (value: number) => void;
}

/**
 * Проверяет, что в cookie лежит объект ширин.
 *
 * @param value - Значение cookie
 * @returns `true`, если это объект «раскладка → ширина»
 */
function isSizeRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Ширина колонки широкого режима. В cookie — чтобы сервер сразу отрисовал
 * колонки нужной ширины, без скачка после загрузки. У каждой раскладки своя
 * ширина: широкая запись класса не сбивает ширину остальным разделам.
 *
 * @param splitId - Под каким ключом ширина лежит в cookie
 * @returns Запомненная ширина и её запись
 */
export function useSectionSplitSize(
  splitId: MaybeRefOrGetter<string>,
): UseSectionSplitSizeReturn {
  const cookie = useCookie<unknown>(SECTION_SPLIT_SIZES_COOKIE, {
    maxAge: SECTION_LAYOUT_COOKIE_MAX_AGE_SECONDS,
    default: () => ({}),
  });

  const size = computed(() => {
    const value = isSizeRecord(cookie.value)
      ? cookie.value[toValue(splitId)]
      : undefined;

    return typeof value === 'number' && Number.isFinite(value)
      ? value
      : undefined;
  });

  const saveSize = useDebounceFn((value: number) => {
    cookie.value = {
      ...(isSizeRecord(cookie.value) ? cookie.value : {}),
      [toValue(splitId)]:
        Math.round(value * SPLIT_SIZE_PRECISION) / SPLIT_SIZE_PRECISION,
    };
  }, SPLIT_SIZE_SAVE_DELAY);

  return {
    size,
    saveSize: (value: number) => {
      saveSize(value);
    },
  };
}
