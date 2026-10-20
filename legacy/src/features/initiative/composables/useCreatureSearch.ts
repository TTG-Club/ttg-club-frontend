import { httpClient } from '@/shared/api';

import type { CreatureOption } from '@/features/initiative/model';
import {
  BESTIARY_SEARCH_PATH,
  CREATURE_SEARCH_DEBOUNCE_MS,
  CREATURE_SEARCH_SIZE,
  parseCreatureOptions,
} from '@/features/initiative/model';

/**
 * Автокомплит существ из бестиария для сборки энкаунтера.
 *
 * Использует тот же эндпоинт, что и страница бестиария
 * (`POST /api/v1/bestiary`), с дебаунсом ввода.
 */
export function useCreatureSearch() {
  const searchTerm = ref('');
  const debouncedTerm = refDebounced(searchTerm, CREATURE_SEARCH_DEBOUNCE_MS);
  const options = ref<Array<CreatureOption>>([]);
  const isLoading = ref(false);

  watch(debouncedTerm, async (term) => {
    const query = term.trim();

    if (!query) {
      options.value = [];

      return;
    }

    isLoading.value = true;

    try {
      const { data } = await httpClient.post<unknown>({
        url: BESTIARY_SEARCH_PATH,
        payload: {
          search: { value: query, exact: false },
          size: CREATURE_SEARCH_SIZE,
        },
      });

      // Защита от гонки: применяем ответ, только если терм всё ещё актуален
      // (иначе поздно резолвнувшийся старый запрос затрёт свежие опции).
      if (debouncedTerm.value.trim() === query) {
        options.value = parseCreatureOptions(data);
      }
    } catch (error) {
      if (debouncedTerm.value.trim() === query) {
        console.error('Ошибка поиска существ:', error);
        options.value = [];
      }
    } finally {
      isLoading.value = false;
    }
  });

  return {
    searchTerm,
    options,
    isLoading,
  };
}
