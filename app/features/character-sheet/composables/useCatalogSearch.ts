import type { CatalogOption, CatalogSearchSource } from '../model';

import { z } from 'zod';

import { buildListRequest } from '~section/model';

import { SHEET_SEARCH_DEBOUNCE, SHEET_SEARCH_SIZE } from '../model';

/**
 * Поиск по разделу справочника: тот же запрос, что у раздела, с паузой после
 * ввода. Поздний ответ на старый запрос не затирает свежий.
 * @param source - раздел, в котором ищем
 */
export function useCatalogSearch<Schema extends z.ZodType>(
  source: MaybeRefOrGetter<CatalogSearchSource<Schema>>,
) {
  const api = useApi();

  const searchTerm = ref('');
  const debouncedTerm = refDebounced(searchTerm, SHEET_SEARCH_DEBOUNCE);
  const options = shallowRef<Array<CatalogOption>>([]);
  const isLoading = ref(false);

  /** Номер последнего запроса: ответ на устаревший отбрасывается. */
  let requestCounter = 0;

  /**
   * Ищет записи раздела.
   * @param term - строка поиска
   */
  async function search(term: string): Promise<void> {
    const query = term.trim();
    const current = toValue(source);
    const requestId = ++requestCounter;

    if (!query) {
      options.value = [];
      isLoading.value = false;

      return;
    }

    isLoading.value = true;

    try {
      const entries = z.array(current.schema).parse(
        await api(current.listUrl, {
          method: 'POST',
          body: buildListRequest({
            page: 0,
            size: SHEET_SEARCH_SIZE,
            search: query,
            filter: current.filter,
          }),
        }),
      );

      if (requestId === requestCounter) {
        options.value = entries.flatMap((entry) => current.toOptions(entry));
      }
    } catch {
      if (requestId === requestCounter) {
        options.value = [];
      }
    } finally {
      if (requestId === requestCounter) {
        isLoading.value = false;
      }
    }
  }

  watch(debouncedTerm, search);

  /** Сбрасывает поиск, например при закрытии окна. */
  function reset(): void {
    searchTerm.value = '';
    options.value = [];
  }

  return { searchTerm, options, isLoading, reset };
}
