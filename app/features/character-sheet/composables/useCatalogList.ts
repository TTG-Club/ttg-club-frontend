import type { FilterDefinition, FilterSelection } from '~section/model';

import type { CatalogRow, ItemSearchKind } from '../model';

import {
  applyExcludedSources,
  buildFilterPayload,
  buildListRequest,
  filterResponseSchema,
  getDefaultSelection,
  isPartCustomized,
  normalizeFilter,
  resetSelectionPart,
  SECTION_PAGE_SIZE_ALL,
} from '~section/model';

import { CATALOG_ADD_SOURCES } from '../model';

/**
 * Весь раздел справочника для окна добавления: фильтр и источники раздела
 * (выбор живёт в окне и адрес страницы не трогает), список целиком одним
 * запросом. Поиск по названию идёт уже на клиенте.
 * @param kind - вид предмета
 */
export function useCatalogList(kind: MaybeRefOrGetter<ItemSearchKind>) {
  const api = useApi();
  const { user } = useUser();

  const source = computed(() => CATALOG_ADD_SOURCES[toValue(kind)]);

  const definition = shallowRef<FilterDefinition | null>(null);
  const selection = shallowRef<FilterSelection>({});
  const rows = shallowRef<Array<CatalogRow>>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  /** Номер последнего запроса: ответ на устаревший отбрасывается. */
  let requestCounter = 0;

  const isOtherCustomized = computed(
    () =>
      !!definition.value
      && isPartCustomized(definition.value, selection.value, 'other'),
  );

  const isSourcesCustomized = computed(
    () =>
      !!definition.value
      && isPartCustomized(definition.value, selection.value, 'sources'),
  );

  const otherGroups = computed(
    () => definition.value?.other.filter((group) => !group.hidden) ?? [],
  );

  const sourceGroups = computed(
    () => definition.value?.sources.filter((group) => !group.hidden) ?? [],
  );

  /** Грузит фильтр раздела; без ручки фильтра у раздела только поиск. */
  async function loadFilter(): Promise<void> {
    const { filterUrl } = source.value.section;

    if (!filterUrl) {
      definition.value = null;

      return;
    }

    const loaded = applyExcludedSources(
      normalizeFilter(
        filterResponseSchema.parse(await api(filterUrl, { method: 'POST' })),
      ),
      user.value?.excludedSources ?? [],
    );

    definition.value = loaded;
    selection.value = getDefaultSelection(loaded);
  }

  /** Грузит список раздела с текущим фильтром. */
  async function loadRows(): Promise<void> {
    const { section, parseRows } = source.value;
    const requestId = ++requestCounter;

    isLoading.value = true;
    isError.value = false;

    try {
      const raw = await api(section.listUrl, {
        method: 'POST',
        body: buildListRequest({
          page: 0,
          size: SECTION_PAGE_SIZE_ALL,
          order: section.order,
          filter: definition.value
            ? buildFilterPayload(definition.value, selection.value)
            : undefined,
        }),
      });

      if (requestId === requestCounter) {
        rows.value = parseRows(raw);
      }
    } catch {
      if (requestId === requestCounter) {
        rows.value = [];
        isError.value = true;
      }
    } finally {
      if (requestId === requestCounter) {
        isLoading.value = false;
      }
    }
  }

  /** Открытие окна: фильтр раздела, затем список. */
  async function open(): Promise<void> {
    rows.value = [];

    try {
      await loadFilter();
    } catch {
      definition.value = null;
    }

    await loadRows();
  }

  /**
   * Новый выбор фильтра: список перезагружается.
   * @param next - выбор
   */
  function setSelection(next: FilterSelection): void {
    selection.value = next;
    void loadRows();
  }

  /**
   * Сбрасывает часть фильтра к выбору по умолчанию.
   * @param part - фильтр по содержимому или источники
   */
  function resetPart(part: 'other' | 'sources'): void {
    if (definition.value) {
      setSelection(resetSelectionPart(definition.value, selection.value, part));
    }
  }

  return {
    rows,
    isLoading,
    isError,
    selection,
    otherGroups,
    sourceGroups,
    isOtherCustomized,
    isSourcesCustomized,
    open,
    reload: loadRows,
    setSelection,
    resetPart,
  };
}
