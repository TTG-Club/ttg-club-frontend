import type { CharacterSheet } from '../model';

import { getApiErrorMessage, getErrorStatus } from '~user/model';

import {
  createEmptySheetDocument,
  createSheet,
  deleteSheet,
  fetchSheetList,
  SHEET_LIMIT_FALLBACK,
  SHEET_TEXT,
} from '../model';

/**
 * Листы персонажей пользователя. Бэкенд узнаёт пользователя по cookie и
 * присылает листы вместе с документами — карточкам хватает их для подписи.
 */
export function useSheetList() {
  const toast = useToast();

  const sheets = shallowRef<Array<CharacterSheet>>([]);
  const limit = ref(SHEET_LIMIT_FALLBACK);
  const isLoading = ref(false);
  const isLoaded = ref(false);
  const isMutating = ref(false);

  /** HTTP-статус ошибки загрузки; `0` — ошибка без статуса. */
  const errorStatus = ref<number>();

  const canCreate = computed(() => sheets.value.length < limit.value);

  async function load(): Promise<void> {
    isLoading.value = true;
    errorStatus.value = undefined;

    try {
      const list = await fetchSheetList();

      sheets.value = list.items;
      limit.value = list.limit;
    } catch (error) {
      errorStatus.value = getErrorStatus(error) ?? 0;
    } finally {
      isLoading.value = false;
      isLoaded.value = true;
    }
  }

  /**
   * Выполняет изменение и перечитывает список.
   * @param action - изменение
   * @param title - текст ошибки
   * @returns результат изменения или `undefined` при ошибке
   */
  async function mutate<Result>(
    action: () => Promise<Result>,
    title: string,
  ): Promise<Result | undefined> {
    isMutating.value = true;

    try {
      const result = await action();

      await load();

      return result;
    } catch (error) {
      toast.add({ title: getApiErrorMessage(error, title), color: 'error' });

      return undefined;
    } finally {
      isMutating.value = false;
    }
  }

  /** Создаёт пустой лист. */
  function create(): Promise<CharacterSheet | undefined> {
    return mutate(
      () => createSheet(SHEET_TEXT.defaultName, createEmptySheetDocument()),
      SHEET_TEXT.errorCreate,
    );
  }

  /**
   * Создаёт копию листа.
   * @param sheet - исходный лист
   */
  function copy(sheet: CharacterSheet): Promise<CharacterSheet | undefined> {
    return mutate(
      () => createSheet(`${sheet.name}${SHEET_TEXT.copySuffix}`, sheet.data),
      SHEET_TEXT.errorCopy,
    );
  }

  /**
   * Удаляет лист.
   * @param id - идентификатор листа
   */
  async function remove(id: string): Promise<void> {
    await mutate(() => deleteSheet(id), SHEET_TEXT.errorDelete);
  }

  return {
    sheets,
    limit,
    canCreate,
    isLoading,
    isLoaded,
    isMutating,
    errorStatus,
    load,
    create,
    copy,
    remove,
  };
}
