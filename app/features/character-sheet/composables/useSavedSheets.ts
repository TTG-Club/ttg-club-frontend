import type { Ref } from 'vue';

import type { SavedSheet } from '../model';

import { getApiErrorMessage } from '~user/model';

import {
  fetchSavedSheets,
  removeSavedSheet,
  SAVED_SHEETS_TEXT,
} from '../model';

/** Возвращаемое значение useSavedSheets. */
export interface UseSavedSheetsReturn {
  items: Ref<Array<SavedSheet>>;
  limit: Ref<number>;
  subscriberLimit: Ref<number>;
  isLoading: Ref<boolean>;
  isLoaded: Ref<boolean>;
  isError: Ref<boolean>;
  load: () => Promise<void>;
  /**
   * Убирает лист из списка; сам лист остаётся у владельца.
   * @param id - идентификатор записи
   */
  remove: (id: string) => Promise<void>;
}

/**
 * «Другие листы»: чужие листы, сохранённые пользователем по ссылке.
 * Недоступные (ссылку отозвали, лист удалили) тоже занимают место в лимите.
 */
export function useSavedSheets(): UseSavedSheetsReturn {
  const toast = useToast();

  const items = shallowRef<Array<SavedSheet>>([]);
  const limit = ref(0);
  const subscriberLimit = ref(0);
  const isLoading = ref(false);
  const isLoaded = ref(false);
  const isError = ref(false);

  async function load(): Promise<void> {
    isLoading.value = true;
    isError.value = false;

    try {
      const list = await fetchSavedSheets();

      items.value = list.items;
      limit.value = list.limit;
      subscriberLimit.value = list.subscriberLimit;
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
      isLoaded.value = true;
    }
  }

  async function remove(id: string): Promise<void> {
    try {
      await removeSavedSheet(id);
      items.value = items.value.filter((item) => item.id !== id);
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, SAVED_SHEETS_TEXT.removeError),
        color: 'error',
      });
    }
  }

  return {
    items,
    limit,
    subscriberLimit,
    isLoading,
    isLoaded,
    isError,
    load,
    remove,
  };
}
