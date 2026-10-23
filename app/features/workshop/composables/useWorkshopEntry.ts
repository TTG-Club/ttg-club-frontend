import type { MaybeRefOrGetter, Ref } from 'vue';

import { getErrorStatus } from '~user/model';

import { fetchReferenceEntry } from '../model';

/** HTTP-статус «не найдено». */
const NOT_FOUND_STATUS = 404;

/** Возвращаемое значение useWorkshopEntry. */
export interface UseWorkshopEntryReturn<Entry> {
  entry: Ref<Entry | undefined>;
  isLoading: Ref<boolean>;
  isNotFound: Ref<boolean>;
  isError: Ref<boolean>;
  /** Перечитывает запись: после сохранения или восстановления. */
  load: () => Promise<void>;
}

/**
 * Запись справочника для правки. Читается только в браузере: мастерская
 * доступна после входа, и на сервере её открывать незачем.
 * @param path - адрес страницы записи
 * @param parse - разбор ответа под редактор
 */
export function useWorkshopEntry<Entry>(
  path: MaybeRefOrGetter<string>,
  parse: (input: unknown) => Entry,
): UseWorkshopEntryReturn<Entry> {
  const entry = shallowRef<Entry>();
  const isLoading = ref(true);
  const isNotFound = ref(false);
  const isError = ref(false);

  async function load(): Promise<void> {
    isLoading.value = true;
    isNotFound.value = false;
    isError.value = false;

    try {
      entry.value = parse(await fetchReferenceEntry(toValue(path)));
    } catch (error) {
      entry.value = undefined;

      if (getErrorStatus(error) === NOT_FOUND_STATUS) {
        isNotFound.value = true;
      } else {
        isError.value = true;
      }
    } finally {
      isLoading.value = false;
    }
  }

  onMounted(load);

  watch(
    () => toValue(path),
    () => {
      void load();
    },
  );

  return { entry, isLoading, isNotFound, isError, load };
}
