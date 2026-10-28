import type { Ref } from 'vue';

import type { SelectOption } from '../model';

import { fetchFilterGroups } from '../model';

/** Возвращаемое значение useFilterGroups. */
export interface UseFilterGroupsReturn {
  isLoading: Ref<boolean>;
  /** Значения группы; пусто, пока фильтры не загружены. */
  getOptions: (groupKey: string) => Array<SelectOption>;
}

/**
 * Списки для формы из фильтров раздела.
 * @param filterPath - ручка фильтров
 */
export function useFilterGroups(filterPath: string): UseFilterGroupsReturn {
  const groups = shallowRef<Map<string, Array<SelectOption>>>(new Map());
  const isLoading = ref(false);

  onMounted(async () => {
    isLoading.value = true;

    try {
      groups.value = await fetchFilterGroups(filterPath);
    } catch {
      groups.value = new Map();
    } finally {
      isLoading.value = false;
    }
  });

  function getOptions(groupKey: string): Array<SelectOption> {
    return groups.value.get(groupKey) ?? [];
  }

  return { isLoading, getOptions };
}
