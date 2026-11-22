import type {
  CharacterSheet,
  SheetDocument,
  SheetLoadStatus,
  SheetSaveStatus,
} from '../model';

import { getApiErrorMessage, getErrorStatus } from '~user/model';

import {
  createEmptySheetDocument,
  fetchSheet,
  saveSheet,
  saveSheetOnLeave,
  SHEET_HTTP_STATUS,
  SHEET_SAVE_DELAY,
  SHEET_TEXT,
} from '../model';

/**
 * Открытый лист персонажа: документ, имя и автосохранение. Правки копятся и
 * уходят на сервер одним запросом после паузы; при уходе со страницы
 * несохранённое отправляется сразу. Сервер хранит версию листа: если лист
 * успели изменить в другом окне, сохранение останавливается до перезагрузки,
 * чтобы не затереть чужие правки.
 */
export const useCharacterSheet = createSharedComposable(() => {
  const toast = useToast();

  const sheetId = ref<string>();
  const name = ref('');
  const document = shallowRef<SheetDocument>(createEmptySheetDocument());
  const version = ref(0);
  const loadStatus = ref<SheetLoadStatus>('idle');
  const saveStatus = ref<SheetSaveStatus>('idle');

  /** Есть правки, которых ещё нет на сервере. */
  const isDirty = ref(false);

  /** Идёт запрос сохранения: следующий ждёт его версии. */
  const isSaving = ref(false);

  const isConflict = computed(() => saveStatus.value === 'conflict');

  const scheduleSave = useDebounceFn(() => save(), SHEET_SAVE_DELAY);

  /**
   * Подставляет лист с сервера.
   * @param sheet - лист из ответа
   */
  function apply(sheet: CharacterSheet): void {
    sheetId.value = sheet.id;
    name.value = sheet.name;
    document.value = sheet.data;
    version.value = sheet.version;
  }

  /**
   * Загружает лист.
   * @param id - идентификатор листа
   */
  async function load(id: string): Promise<void> {
    loadStatus.value = 'pending';
    saveStatus.value = 'idle';
    isDirty.value = false;

    try {
      apply(await fetchSheet(id));
      loadStatus.value = 'ready';
    } catch (error) {
      loadStatus.value =
        getErrorStatus(error) === SHEET_HTTP_STATUS.notFound
          ? 'notFound'
          : 'error';
    }
  }

  /** Отправляет накопленные правки; пока идёт прошлый запрос — ждёт его. */
  async function save(): Promise<void> {
    const id = sheetId.value;

    if (!id || !isDirty.value || isSaving.value || isConflict.value) {
      return;
    }

    isSaving.value = true;
    isDirty.value = false;
    saveStatus.value = 'saving';

    try {
      const saved = await saveSheet(id, {
        name: name.value,
        data: document.value,
        version: version.value,
      });

      // Ответ несёт новую версию; документ из ответа не подставляем — пока
      // запрос шёл, игрок мог продолжить правки
      version.value = saved.version;
      saveStatus.value = isDirty.value ? 'pending' : 'saved';
    } catch (error) {
      if (getErrorStatus(error) === SHEET_HTTP_STATUS.conflict) {
        saveStatus.value = 'conflict';

        return;
      }

      isDirty.value = true;
      saveStatus.value = 'error';

      toast.add({
        title: getApiErrorMessage(error, SHEET_TEXT.errorSave),
        color: 'error',
      });
    } finally {
      isSaving.value = false;
    }

    // Правки, сделанные во время запроса, уходят следующим
    if (isDirty.value) {
      scheduleSave();
    }
  }

  /** Отмечает правку и откладывает сохранение. */
  function markDirty(): void {
    isDirty.value = true;

    if (!isConflict.value) {
      saveStatus.value = 'pending';
      scheduleSave();
    }
  }

  /**
   * Меняет документ листа.
   * @param change - новый документ из текущего
   */
  function update(change: (current: SheetDocument) => SheetDocument): void {
    document.value = change(document.value);
    markDirty();
  }

  /**
   * Переименовывает персонажа.
   * @param next - новое имя
   */
  function rename(next: string): void {
    name.value = next;
    markDirty();
  }

  /** Перечитывает лист с сервера после конфликта версий. */
  async function reload(): Promise<void> {
    if (sheetId.value) {
      await load(sheetId.value);
    }
  }

  /** Уход со страницы: несохранённое уходит запросом, который переживёт её. */
  function flushOnLeave(): void {
    if (!sheetId.value || !isDirty.value || isConflict.value) {
      return;
    }

    saveSheetOnLeave(sheetId.value, {
      name: name.value,
      data: document.value,
      version: version.value,
    });

    isDirty.value = false;
  }

  useEventListener('pagehide', flushOnLeave);

  tryOnScopeDispose(flushOnLeave);

  return {
    sheetId,
    name,
    document,
    loadStatus,
    saveStatus,
    load,
    reload,
    update,
    rename,
  };
});
