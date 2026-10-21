import type { FilterSelection } from '../model';

import {
  buildFilterPayload,
  filterResponseSchema,
  getDefaultSelection,
  isSelectionCustomized,
  normalizeFilter,
  selectionFromQuery,
  selectionToQuery,
} from '../model';

/**
 * Фильтр раздела: группы приходят из API, выбор живёт в адресе страницы,
 * поэтому ссылкой на отфильтрованный список можно поделиться.
 * @param key - ключ раздела
 * @param url - ручка фильтра, например `/api/v1/filters/spells`
 */
export async function useSectionFilter(key: string, url: string) {
  const route = useRoute();
  const router = useRouter();

  const { data: definition, status } = await useAsyncData(
    `section-filter-${key}`,
    async () =>
      normalizeFilter(
        filterResponseSchema.parse(await $fetch(url, { method: 'POST' })),
      ),
    { deep: false },
  );

  const selection = computed<FilterSelection>(() =>
    definition.value ? selectionFromQuery(definition.value, route.query) : {},
  );

  const isCustomized = computed(
    () =>
      !!definition.value
      && isSelectionCustomized(definition.value, selection.value),
  );

  // Фильтр уходит в запрос списка, только если его меняли.
  const payload = computed(() =>
    definition.value && isCustomized.value
      ? buildFilterPayload(definition.value, selection.value)
      : undefined,
  );

  const isPending = computed(() => status.value === 'pending');

  /**
   * Применяет выбор: он записывается в адрес, а список перезагружается.
   * @param next - новый выбор
   */
  function setSelection(next: FilterSelection) {
    if (!definition.value) {
      return;
    }

    router.replace({
      query: { ...route.query, ...selectionToQuery(definition.value, next) },
      hash: route.hash,
    });
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
