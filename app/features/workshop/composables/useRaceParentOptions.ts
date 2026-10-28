import type { Ref } from 'vue';

import type { SelectOption } from '../model';

import { fetchRaceParentOptions } from '../model';

/** Возвращаемое значение useRaceParentOptions. */
export interface UseRaceParentOptionsReturn {
  isLoading: Ref<boolean>;
  /** Расы для выбора; пусто, пока список не загружен. */
  options: Ref<Array<SelectOption>>;
}

/**
 * Расы для выбора родительской. Без списка выбор пуст, но форма остаётся
 * рабочей.
 * @param excludeId - идентификатор редактируемой расы
 */
export function useRaceParentOptions(
  excludeId: number | undefined,
): UseRaceParentOptionsReturn {
  const options = shallowRef<Array<SelectOption>>([]);
  const isLoading = ref(false);

  onMounted(async () => {
    isLoading.value = true;

    try {
      options.value = await fetchRaceParentOptions(excludeId);
    } catch {
      options.value = [];
    } finally {
      isLoading.value = false;
    }
  });

  return { isLoading, options };
}
