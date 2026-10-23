import type { Ref } from 'vue';

import type { BookSourceOption } from '../model';

import { fetchBookSources } from '../model';

/** Возвращаемое значение useBookSources. */
export interface UseBookSourcesReturn {
  options: Ref<Array<BookSourceOption>>;
  isLoading: Ref<boolean>;
}

/**
 * Книги для выбора источника в редакторах. Без списка выбор просто пуст:
 * источник необязателен, и форма сохраняется и так.
 */
export function useBookSources(): UseBookSourcesReturn {
  const options = ref<Array<BookSourceOption>>([]);
  const isLoading = ref(false);

  onMounted(async () => {
    isLoading.value = true;

    try {
      options.value = await fetchBookSources();
    } catch {
      options.value = [];
    } finally {
      isLoading.value = false;
    }
  });

  return { options, isLoading };
}
