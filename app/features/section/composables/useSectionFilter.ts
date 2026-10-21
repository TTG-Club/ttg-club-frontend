import type { FilterSelection, SectionQueryStore } from '../model';

import {
  buildFilterPayload,
  filterResponseSchema,
  getDefaultSelection,
  isSelectionCustomized,
  normalizeFilter,
  selectionFromQuery,
  selectionToQuery,
} from '../model';
import { useRouteQueryStore } from './useSectionQuery';

interface SectionFilterOptions {
  /** Где живёт выбор; по умолчанию в адресе страницы. */
  store?: SectionQueryStore;
  /**
   * Отправлять фильтр всегда, а не только изменённый: у списков во
   * вкладках класса скрытая группа выбирает класс.
   */
  isAlwaysSent?: boolean;
}

/**
 * Фильтр раздела: группы приходят из API, выбор живёт в адресе страницы,
 * поэтому ссылкой на отфильтрованный список можно поделиться.
 * @param key - ключ раздела
 * @param url - ручка фильтра, например `/api/v1/filters/spells`
 * @param options - где живёт выбор и всегда ли отправлять фильтр
 */
export async function useSectionFilter(
  key: string,
  url: string,
  options: SectionFilterOptions = {},
) {
  const { store = useRouteQueryStore(), isAlwaysSent = false } = options;

  const { data: definition, status } = await useAsyncData(
    `section-filter-${key}`,
    async () =>
      normalizeFilter(
        filterResponseSchema.parse(await $fetch(url, { method: 'POST' })),
      ),
    { deep: false },
  );

  const selection = computed<FilterSelection>(() =>
    definition.value
      ? selectionFromQuery(definition.value, store.query.value)
      : {},
  );

  const isCustomized = computed(
    () =>
      !!definition.value
      && isSelectionCustomized(definition.value, selection.value),
  );

  // Фильтр уходит в запрос списка, только если его меняли или он нужен всегда.
  const payload = computed(() =>
    definition.value && (isAlwaysSent || isCustomized.value)
      ? buildFilterPayload(definition.value, selection.value)
      : undefined,
  );

  const isPending = computed(() => status.value === 'pending');

  /**
   * Применяет выбор: он записывается в параметры, а список перезагружается.
   * @param next - новый выбор
   */
  function setSelection(next: FilterSelection) {
    if (!definition.value) {
      return;
    }

    store.update(selectionToQuery(definition.value, next));
  }

  function reset() {
    if (definition.value) {
      setSelection(getDefaultSelection(definition.value));
    }
  }

  return {
    definition,
    selection,
    isCustomized,
    isPending,
    payload,
    setSelection,
    reset,
  };
}
