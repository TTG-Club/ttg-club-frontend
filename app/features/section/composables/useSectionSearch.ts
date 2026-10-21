import { getQueryString, SEARCH_DEBOUNCE_MS, SEARCH_QUERY_KEY } from '../model';

/**
 * Поиск по разделу. Строка в поле меняется сразу, а в адрес и в запрос
 * списка попадает с задержкой, чтобы не грузить список на каждую букву.
 */
export function useSectionSearch() {
  const route = useRoute();
  const router = useRouter();

  const term = computed(
    () => getQueryString(route.query[SEARCH_QUERY_KEY])?.trim() ?? '',
  );

  const input = ref(term.value);

  watchDebounced(
    input,
    (value) => {
      const next = value.trim();

      if (next === term.value) {
        return;
      }

      router.replace({
        query: { ...route.query, [SEARCH_QUERY_KEY]: next || undefined },
        hash: route.hash,
      });
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
