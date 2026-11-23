import type { CharacterSheet } from '../model';

import { getApiErrorMessage, getErrorStatus } from '~user/model';

import {
  createEmptySheetDocument,
  createSheet,
  deleteSheet,
  fetchSheetList,
  getSheetNameFromFileName,
  parseSheetImport,
  SHEET_IMPORT_ERROR_TEXT,
  SHEET_LIMIT_FALLBACK,
  SHEET_LIST_TEXT,
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

  /**
   * Создаёт лист из JSON-файла экспорта. Отказы (лимит, посторонний файл)
   * объясняет тостом.
   * @param file - выбранный файл
   * @returns созданный лист или `undefined` при отказе
   */
  async function importFromFile(
    file: File,
  ): Promise<CharacterSheet | undefined> {
    if (!canCreate.value) {
      toast.add({ title: SHEET_LIST_TEXT.importLimit, color: 'error' });

      return undefined;
    }

    let text: string;

    try {
      text = await file.text();
    } catch {
      toast.add({ title: SHEET_LIST_TEXT.importFailed, color: 'error' });

      return undefined;
    }

    const parsed = parseSheetImport(text, getSheetNameFromFileName(file.name));

    if (!parsed.success) {
      toast.add({
        title: SHEET_LIST_TEXT.importFailed,
        description: SHEET_IMPORT_ERROR_TEXT[parsed.error],
        color: 'error',
      });

      return undefined;
    }

    const created = await mutate(
      () => createSheet(parsed.sheet.name, parsed.sheet.data),
      SHEET_LIST_TEXT.importFailed,
    );

    if (created) {
      toast.add({
        title: SHEET_LIST_TEXT.importSuccess,
        description: created.name,
        color: 'success',
      });
    }

    return created;
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
    importFromFile,
  };
}
