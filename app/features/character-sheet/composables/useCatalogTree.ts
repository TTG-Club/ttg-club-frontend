import type {
  CatalogOption,
  CatalogTreeEntry,
  CatalogTreeSource,
} from '../model';

import { z } from 'zod';

import { buildListRequest, SECTION_PAGE_SIZE_ALL } from '~section/model';

import {
  CATALOG_TREE_EXPANDED_CLASS,
  CATALOG_TREE_ROW_CLASSES,
  filterCatalogTree,
  findCatalogTreeEntry,
  sortCatalogTree,
  toCatalogOption,
} from '../model';

/**
 * Класс строки по выбранности.
 * @param isSelected - строка выбрана
 */
function getRowClass(isSelected: boolean): string {
  return isSelected
    ? CATALOG_TREE_ROW_CLASSES.selected
    : CATALOG_TREE_ROW_CLASSES.idle;
}

/**
 * Выбор записи раздела деревом, как в окне «Добавление класса» core-app:
 * раздел грузится целиком один раз, поиск идёт по загруженному, строки
 * раскрываются до вложенных записей (подклассы, разновидности).
 * @param source - раздел справочника
 * @param excludedUrls - записи, которых не должно быть в списке
 */
export function useCatalogTree<Schema extends z.ZodType>(
  source: CatalogTreeSource<Schema>,
  excludedUrls: MaybeRefOrGetter<ReadonlyArray<string>> = [],
) {
  const api = useApi();

  const entries = shallowRef<Array<CatalogTreeEntry>>([]);
  const isLoading = ref(false);
  const hasError = ref(false);
  const searchTerm = ref('');
  const expandedUrls = shallowRef<ReadonlySet<string>>(new Set());
  const selectedUrl = ref<string | null>(null);

  const available = computed(() => {
    const excluded = new Set(toValue(excludedUrls));

    return entries.value.filter((entry) => !excluded.has(entry.url));
  });

  const rows = computed(() =>
    filterCatalogTree(available.value, searchTerm.value).map(
      ({ entry, isChildMatch }) => {
        const isExpanded = isChildMatch || expandedUrls.value.has(entry.url);
        const isSelected = selectedUrl.value === entry.url;

        return {
          ...entry,
          isExpanded,
          isSelected,
          rowClass: getRowClass(isSelected),
          chevronClass: isExpanded ? CATALOG_TREE_EXPANDED_CLASS : '',
          children: entry.children.map((child) => {
            const isChildSelected = selectedUrl.value === child.url;

            return {
              ...child,
              isSelected: isChildSelected,
              rowClass: getRowClass(isChildSelected),
            };
          }),
        };
      },
    ),
  );

  const selected = computed<CatalogOption | null>(() => {
    const lookup = findCatalogTreeEntry(available.value, selectedUrl.value);

    return lookup ? toCatalogOption(lookup) : null;
  });

  /** Загружает раздел целиком; повторный вызов ничего не делает. */
  async function load(): Promise<void> {
    if (entries.value.length || isLoading.value) {
      return;
    }

    isLoading.value = true;
    hasError.value = false;

    try {
      const links = z.array(source.schema).parse(
        await api(source.listUrl, {
          method: 'POST',
          body: buildListRequest({ page: 0, size: SECTION_PAGE_SIZE_ALL }),
        }),
      );

      entries.value = sortCatalogTree(links.map(source.toEntry));
    } catch {
      entries.value = [];
      hasError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Раскрывает или сворачивает строку.
   * @param url - адрес записи
   */
  function toggle(url: string): void {
    const next = new Set(expandedUrls.value);

    if (next.has(url)) {
      next.delete(url);
    } else {
      next.add(url);
    }

    expandedUrls.value = next;
  }

  /**
   * Выбирает запись.
   * @param url - адрес записи
   */
  function select(url: string): void {
    selectedUrl.value = url;
  }

  /** Сбрасывает поиск, раскрытие и выбор, например при закрытии окна. */
  function reset(): void {
    searchTerm.value = '';
    expandedUrls.value = new Set();
    selectedUrl.value = null;
  }

  return {
    rows,
    selected,
    searchTerm,
    isLoading,
    hasError,
    load,
    toggle,
    select,
    reset,
  };
}
