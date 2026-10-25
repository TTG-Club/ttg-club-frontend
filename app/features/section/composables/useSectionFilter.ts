import type { FilterPart, FilterSelection, SectionQueryStore } from '../model';

import {
  applyExcludedSources,
  buildFilterPayload,
  filterResponseSchema,
  getDefaultSelection,
  isSelectionCustomized,
  normalizeFilter,
  resetSelectionPart,
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
 * поэтому ссылкой на отфильтрованный список можно поделиться. Книги, снятые
 * пользователем в личном кабинете, сняты и в источниках по умолчанию.
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

  const { user } = useUser();

  const { data: response, status } = await useAsyncData(
    `section-filter-${key}`,
    async () =>
      normalizeFilter(
        filterResponseSchema.parse(await $fetch(url, { method: 'POST' })),
      ),
    { deep: false },
  );

  // Выбор по умолчанию с учётом источников из личного кабинета
  const definition = computed(() =>
    response.value
      ? applyExcludedSources(response.value, user.value?.excludedSources ?? [])
      : null,
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

  // Фильтр уходит в запрос списка, только если он нужен всегда или выбор
  // отличается от общего по умолчанию из API: источники из личного кабинета
  // бэкенд сам не знает.
  const payload = computed(() =>
    definition.value
    && response.value
    && (isAlwaysSent || isSelectionCustomized(response.value, selection.value))
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

  /**
   * Возвращает выбор к умолчанию: весь или только одну часть фильтра.
   * @param part - источники или условия по содержимому
   */
  function reset(part?: FilterPart) {
    if (!definition.value) {
      return;
    }

    setSelection(
      part
        ? resetSelectionPart(definition.value, selection.value, part)
        : getDefaultSelection(definition.value),
    );
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
