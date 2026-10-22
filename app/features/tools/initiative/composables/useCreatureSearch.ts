import type { CreatureOption } from '../model';

import { BESTIARY_SECTION } from '~bestiary/model';
import { buildListRequest } from '~section/model';

import {
  CREATURE_SEARCH,
  creatureOptionsSchema,
  toCreatureOptions,
} from '../model';

/**
 * Поиск существ бестиария для боя: тот же запрос, что у раздела, с паузой
 * после ввода. Поздний ответ на старый запрос не затирает свежий.
 */
export function useCreatureSearch() {
  const searchTerm = ref('');
  const debouncedTerm = refDebounced(searchTerm, CREATURE_SEARCH.debounceMs);
  const options = shallowRef<Array<CreatureOption>>([]);
  const isLoading = ref(false);

  watch(debouncedTerm, async (term) => {
    const query = term.trim();

    if (!query) {
      options.value = [];

      return;
    }

    isLoading.value = true;

    try {
      const creatures = creatureOptionsSchema.parse(
        await $fetch(BESTIARY_SECTION.listUrl, {
          method: 'POST',
          body: buildListRequest({
            page: 0,
            size: CREATURE_SEARCH.size,
            search: query,
          }),
        }),
      );

      if (debouncedTerm.value.trim() === query) {
        options.value = toCreatureOptions(creatures);
      }
    } catch {
      if (debouncedTerm.value.trim() === query) {
        options.value = [];
      }
    } finally {
      isLoading.value = false;
    }
  });

  return { searchTerm, options, isLoading };
}
