import type { SectionQueryStore } from '../model';

import { getQueryString, SEARCH_DEBOUNCE_MS, SEARCH_QUERY_KEY } from '../model';
import { useRouteQueryStore } from './useSectionQuery';

/**
 * Поиск по разделу. Строка в поле меняется сразу, а в параметры и в запрос
 * списка попадает с задержкой, чтобы не грузить список на каждую букву.
 * @param store - где живут параметры; по умолчанию в адресе страницы
 */
export function useSectionSearch(
  store: SectionQueryStore = useRouteQueryStore(),
) {
  const term = computed(
    () => getQueryString(store.query.value[SEARCH_QUERY_KEY])?.trim() ?? '',
  );

  const input = ref(term.value);

  watchDebounced(
    input,
    (value) => {
      const next = value.trim();

      if (next === term.value) {
        return;
      }

      store.update({ [SEARCH_QUERY_KEY]: next || undefined });
    },
    { debounce: SEARCH_DEBOUNCE_MS },
  );

  // Переход назад по истории меняет адрес, а не поле.
  watch(term, (value) => {
    if (value !== input.value.trim()) {
      input.value = value;
    }
  });

  return { input, term };
}
