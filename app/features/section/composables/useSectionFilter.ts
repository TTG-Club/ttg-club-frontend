import type { FilterPart, FilterSelection, SectionQueryStore } from '../model';

import {
  applyExcludedSources,
  buildFilterPayload,
  compactFilterQuery,
  filterResponseSchema,
  getDefaultSelection,
  hasFilterQuery,
  isSelectionCustomized,
  normalizeFilter,
  resetSelectionPart,
  savedFilterQuerySchema,
  SECTION_FILTER_COOKIE_MAX_AGE_SECONDS,
  SECTION_FILTER_COOKIE_PREFIX,
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
 * поэтому ссылкой на отфильтрованный список можно поделиться. Выбор в адресе
 * ещё и запоминается: раздел, открытый без фильтра в адресе, например
 * после записи, показывает последний выбор, как в старом SPA. Книги, снятые
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
  const api = useApi();

  // Запоминается только выбор в адресе: у списков во вкладках он свой
  const savedCookie = options.store
    ? undefined
    : useCookie<unknown>(`${SECTION_FILTER_COOKIE_PREFIX}${key}`, {
        maxAge: SECTION_FILTER_COOKIE_MAX_AGE_SECONDS,
        default: () => undefined,
      });

  // В cookie может попасть что угодно — без проверки выбор не берётся
  const savedQuery = computed(() => {
    const parsed = savedFilterQuerySchema.safeParse(savedCookie?.value);

    return parsed.success ? parsed.data : {};
  });

  const { user } = useUser();

  const { data: response, status } = await useAsyncData(
    `section-filter-${key}`,
    async () =>
      normalizeFilter(
        filterResponseSchema.parse(await api(url, { method: 'POST' })),
      ),
    { deep: false },
  );

  // Выбор по умолчанию с учётом источников из личного кабинета
  const definition = computed(() =>
    response.value
      ? applyExcludedSources(response.value, user.value?.excludedSources ?? [])
      : null,
  );

  // Фильтр из адреса главнее запомненного: так работает ссылка на
  // отфильтрованный список
  const query = computed(() =>
    definition.value && !hasFilterQuery(definition.value, store.query.value)
      ? { ...savedQuery.value, ...store.query.value }
      : store.query.value,
  );

  const selection = computed<FilterSelection>(() =>
    definition.value ? selectionFromQuery(definition.value, query.value) : {},
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

    const patch = selectionToQuery(definition.value, next);

    store.update(patch);

    if (savedCookie) {
      const saved = compactFilterQuery(patch);

      savedCookie.value = Object.keys(saved).length > 0 ? saved : undefined;
    }
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
