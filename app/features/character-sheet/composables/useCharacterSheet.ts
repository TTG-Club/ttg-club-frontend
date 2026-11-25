import type {
  AbilityKey,
  CharacterSheet,
  SharedSheet,
  SheetDocument,
  SheetLoadStatus,
  SheetSaveStatus,
} from '../model';

import { getApiErrorMessage, getErrorStatus } from '~user/model';

import {
  createEmptySheetDocument,
  fetchSharedSheet,
  fetchSheet,
  saveSheet,
  saveSheetOnLeave,
  SHEET_HIDDEN_CONTROL_CLASS,
  SHEET_HTTP_STATUS,
  SHEET_LOCKED_STORAGE_KEY,
  SHEET_READONLY_TEXT,
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

  /** Секрет ссылки, если лист открыт по ней: только чтение, без сохранения. */
  const sharedToken = ref<string | null>(null);

  /** Свой ли лист открыт по ссылке и сохранён ли он в «Других листах». */
  const sharedInfo = shallowRef<Pick<SharedSheet, 'own' | 'savedId'> | null>(
    null,
  );

  /** Ссылка своего листа (окно «Поделиться»); null — доступ выключен. */
  const shareToken = ref<string | null>(null);

  /** Лист открыт по ссылке: правки и сохранение закрыты. */
  const isReadonly = computed(() => sharedToken.value !== null);

  /**
   * Запертые листы: замок помнится в браузере для каждого листа, чтобы после
   * перезагрузки игровой режим не снимался сам.
   */
  const lockedSheetIds = useLocalStorage<Array<string>>(
    SHEET_LOCKED_STORAGE_KEY,
    [],
  );

  /** Лист заперт игроком: правка закрыта, броски и игровые действия остаются. */
  const isLocked = computed({
    get: () =>
      isReadonly.value
      || (Boolean(sheetId.value)
        && lockedSheetIds.value.includes(sheetId.value ?? '')),
    set: (locked: boolean) => {
      const id = sheetId.value;

      if (!id || isReadonly.value) {
        return;
      }

      const others = lockedSheetIds.value.filter((lockedId) => lockedId !== id);

      lockedSheetIds.value = locked ? [...others, id] : others;
    },
  });

  /**
   * Класс кнопок правки: у запертого листа они прячутся видимостью, а не
   * удалением, чтобы раскладка не съезжала.
   */
  const editControlClass = computed(() =>
    isLocked.value ? SHEET_HIDDEN_CONTROL_CLASS : undefined,
  );

  /** Характеристика под курсором: панель навыков подсвечивает её навыки. */
  const highlightedAbility = ref<AbilityKey | null>(null);

  function toggleLock(): void {
    isLocked.value = !isLocked.value;
  }

  /**
   * Можно ли править лист. У запертого — нет: окна правки не открываются, а
   * игрок получает подсказку, как отпереть лист.
   */
  function ensureEditable(): boolean {
    if (isReadonly.value) {
      toast.add({
        title: SHEET_READONLY_TEXT.editBlocked,
        description: SHEET_READONLY_TEXT.editBlockedDescription,
        icon: 'tabler:eye',
        color: 'warning',
      });

      return false;
    }

    if (!isLocked.value) {
      return true;
    }

    toast.add({
      title: SHEET_TEXT.lockedTitle,
      description: SHEET_TEXT.lockedDescription,
      icon: 'tabler:lock',
      color: 'warning',
    });

    return false;
  }

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
    shareToken.value = sheet.shareToken;
  }

  /**
   * Загружает лист.
   * @param id - идентификатор листа
   */
  async function load(id: string): Promise<void> {
    loadStatus.value = 'pending';
    saveStatus.value = 'idle';
    isDirty.value = false;
    sharedToken.value = null;
    sharedInfo.value = null;

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

  /**
   * Загружает лист по ссылке — только для чтения.
   * @param token - секрет ссылки
   */
  async function loadShared(token: string): Promise<void> {
    loadStatus.value = 'pending';
    saveStatus.value = 'idle';
    isDirty.value = false;
    sharedToken.value = token;
    sharedInfo.value = null;

    try {
      const shared = await fetchSharedSheet(token);

      sheetId.value = shared.id;
      name.value = shared.name;
      document.value = shared.data;
      version.value = 0;
      shareToken.value = null;
      sharedInfo.value = { own: shared.own, savedId: shared.savedId };
      loadStatus.value = 'ready';
    } catch (error) {
      loadStatus.value =
        getErrorStatus(error) === SHEET_HTTP_STATUS.notFound
          ? 'notFound'
          : 'error';
    }
  }

  /**
   * Отмечает лист сохранённым в «Других листах».
   * @param savedId - идентификатор записи
   */
  function markShared(savedId: string): void {
    if (sharedInfo.value) {
      sharedInfo.value = { ...sharedInfo.value, savedId };
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
    // Лист по ссылке не меняется: правки некуда сохранить
    if (isReadonly.value) {
      return;
    }

    document.value = change(document.value);
    markDirty();
  }

  /**
   * Переименовывает персонажа.
   * @param next - новое имя
   */
  function rename(next: string): void {
    if (isReadonly.value) {
      return;
    }

    name.value = next;
    markDirty();
  }

  /** Перечитывает лист с сервера после конфликта версий. */
  async function reload(): Promise<void> {
    if (sharedToken.value) {
      await loadShared(sharedToken.value);

      return;
    }

    if (sheetId.value) {
      await load(sheetId.value);
    }
  }

  /** Уход со страницы: несохранённое уходит запросом, который переживёт её. */
  function flushOnLeave(): void {
    if (
      !sheetId.value
      || !isDirty.value
      || isConflict.value
      || isReadonly.value
    ) {
      return;
    }

    saveSheetOnLeave(sheetId.value, {
      name: name.value,
      data: document.value,
      version: version.value,
    });

    isDirty.value = false;
  }

  /**
   * Забывает несохранённые правки: лист удалён, и сохранять их некуда.
   */
  function discardChanges(): void {
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
    isLocked,
    isReadonly,
    shareToken,
    sharedToken,
    sharedInfo,
    highlightedAbility,
    ensureEditable,
    editControlClass,
    toggleLock,
    load,
    loadShared,
    markShared,
    reload,
    update,
    rename,
    discardChanges,
  };
});
