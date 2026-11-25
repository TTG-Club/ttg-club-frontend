import type { CharacterSheet, SheetDocument } from '../model';

import { getApiErrorMessage, getErrorStatus } from '~user/model';

import {
  createEmptySheetDocument,
  createSheet,
  deleteSheet,
  fetchSheetList,
  getSheetNameFromFileName,
  importExternalSheet,
  LSS_IMPORT_TEXT,
  parseJsonSafely,
  parseSheetImport,
  saveSheet,
  SHEET_IMPORT_ERROR_TEXT,
  SHEET_LIMIT_FALLBACK,
  SHEET_LIST_TEXT,
  SHEET_TEXT,
  uploadSheetAvatar,
  withoutSheetAvatar,
} from '../model';

/**
 * Копирует файл портрета в новый лист: файл у каждого листа свой, иначе
 * удаление одного листа оставило бы другой без портрета.
 * @param sourceUrl - адрес портрета исходного листа
 * @param target - только что созданная копия без портрета
 * @returns копия с портретом; при сбое — копия как есть
 */
async function copySheetAvatar(
  sourceUrl: string | null,
  target: CharacterSheet,
): Promise<CharacterSheet> {
  if (!sourceUrl) {
    return target;
  }

  try {
    const response = await fetch(sourceUrl);

    if (!response.ok) {
      return target;
    }

    const blob = await response.blob();
    const file = new File([blob], `${target.id}.webp`, { type: blob.type });
    const avatarUrl = await uploadSheetAvatar(target.id, file);

    return await saveSheet(target.id, {
      data: { ...target.data, avatarUrl },
      version: target.version,
    });
  } catch {
    return target;
  }
}

/**
 * Листы персонажей пользователя. Бэкенд узнаёт пользователя по cookie и
 * присылает листы вместе с документами — карточкам хватает их для подписи.
 */
export function useSheetList() {
  const toast = useToast();

  const sheets = shallowRef<Array<CharacterSheet>>([]);
  const limit = ref(SHEET_LIMIT_FALLBACK);
  const subscriberLimit = ref(0);
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
      subscriberLimit.value = list.subscriberLimit;
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
   * Создаёт копию листа (своего или чужого); портрет копируется отдельным
   * файлом.
   * @param name - имя исходного листа
   * @param data - документ исходного листа
   */
  function copyDocument(
    name: string,
    data: SheetDocument,
  ): Promise<CharacterSheet | undefined> {
    return mutate(
      async () =>
        copySheetAvatar(
          data.avatarUrl,
          await createSheet(
            `${name}${SHEET_TEXT.copySuffix}`,
            withoutSheetAvatar(data),
          ),
        ),
      SHEET_TEXT.errorCopy,
    );
  }

  /**
   * Создаёт копию своего листа.
   * @param sheet - исходный лист
   */
  function copy(sheet: CharacterSheet): Promise<CharacterSheet | undefined> {
    return copyDocument(sheet.name, sheet.data);
  }

  /**
   * Запоминает новую ссылку листа после окна «Поделиться».
   * @param id - идентификатор листа
   * @param shareToken - секрет ссылки; null — доступ выключен
   */
  function setShareToken(id: string, shareToken: string | null): void {
    sheets.value = sheets.value.map((sheet) =>
      sheet.id === id ? { ...sheet, shareToken } : sheet,
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

    const fallbackName = getSheetNameFromFileName(file.name);
    const json = parseJsonSafely(text);

    // Файл чужого формата (Long Story Short) узнаётся первым: иначе его
    // обёртка сошла бы за голый документ листа
    const external =
      json === undefined ? null : await importExternalSheet(json, fallbackName);

    const parsed = external
      ? { success: true as const, sheet: external.sheet }
      : parseSheetImport(text, fallbackName);

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
        title: external
          ? LSS_IMPORT_TEXT.success(external.sourceLabel)
          : SHEET_LIST_TEXT.importSuccess,
        description: created.name,
        color: 'success',
      });

      for (const warning of external?.warnings ?? []) {
        toast.add({ title: warning, color: 'warning' });
      }
    }

    return created;
  }

  return {
    sheets,
    limit,
    subscriberLimit,
    canCreate,
    isLoading,
    isLoaded,
    isMutating,
    errorStatus,
    load,
    create,
    copy,
    copyDocument,
    setShareToken,
    remove,
    importFromFile,
  };
}
