import type {
  AbilityKey,
  CharacterSheet,
  SharedSheet,
  SheetDocument,
  SheetLoadStatus,
  SheetSaveQueue,
  SheetSaveStatus,
  SheetServerState,
} from '../model';

import { getApiErrorMessage, getErrorStatus } from '~user/model';

import {
  createEmptySheetDocument,
  createSheetSaveQueue,
  fetchSharedSheet,
  fetchSheet,
  mergeSheetSnapshots,
  saveSheet,
  saveSheetOnLeave,
  SHEET_HIDDEN_CONTROL_CLASS,
  SHEET_HTTP_STATUS,
  SHEET_LOCKED_STORAGE_KEY,
  SHEET_READONLY_TEXT,
  SHEET_TEXT,
} from '../model';

/**
 * Лист с сервера в том виде, в каком его сохраняет очередь.
 * @param sheet - лист из ответа
 * @returns снимок и версия
 */
function toServerState(sheet: CharacterSheet): SheetServerState {
  return {
    snapshot: { name: sheet.name, data: sheet.data },
    version: sheet.version,
  };
}

/**
 * Конфликт версий: лист успел сохранить кто-то ещё.
 * @param error - пойманная ошибка
 * @returns true, если сервер ответил 409
 */
function isVersionConflict(error: unknown): boolean {
  return getErrorStatus(error) === SHEET_HTTP_STATUS.conflict;
}

/**
 * Открытый лист персонажа: документ, имя и автосохранение. Правки копятся и
 * уходят на сервер одним запросом после паузы; при уходе со страницы
 * несохранённое отправляется сразу.
 *
 * Лист могут править сразу несколько человек (владелец и редакторы, которым
 * он разрешил правки). Сервер хранит версию листа: если лист успели сохранить
 * в другом месте, сервер отвечает конфликтом — тогда свежий лист загружается,
 * свои правки сливаются с ним и уходят заново. Если отметка присутствия
 * сообщает о более новой версии, чужие правки подтягиваются тем же слиянием,
 * не дожидаясь своего сохранения. Конфликт показывается, только если
 * перечитать лист или слить правки не вышло.
 */
export const useCharacterSheet = createSharedComposable(() => {
  const toast = useToast();

  const sheetId = ref<string>();
  const name = ref('');
  const document = shallowRef<SheetDocument>(createEmptySheetDocument());
  const loadStatus = ref<SheetLoadStatus>('idle');
  const saveStatus = ref<SheetSaveStatus>('idle');

  /** Очередь сохранения открытого листа; null — сохранять нечего. */
  let saveQueue: SheetSaveQueue | null = null;

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

  /** Лист чужой и открыт по праву редактора: удалять и делиться нельзя. */
  const isEditor = ref(false);

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

  /**
   * Сменяет очередь сохранения. Хвост правок прошлой очереди досылается со
   * своей версией и в новый лист уже не попадёт.
   * @param next - очередь нового листа; null — сохранять нечего
   * @param keepPending - досылать ли несохранённое прошлой очереди
   */
  function replaceQueue(
    next: SheetSaveQueue | null,
    keepPending: boolean,
  ): void {
    if (saveQueue && !keepPending) {
      saveQueue.discard();
    }

    saveQueue?.detach();
    saveQueue = next;
  }

  /**
   * Очередь сохранения загруженного листа.
   * @param id - идентификатор листа
   * @param initial - лист в том виде, в каком его отдал сервер
   * @returns очередь
   */
  function createQueue(id: string, initial: SheetServerState): SheetSaveQueue {
    const queue = createSheetSaveQueue(initial, {
      save: async (snapshot, version, options) => {
        const body = { ...snapshot, version };

        if (options.keepalive) {
          saveSheetOnLeave(id, body);

          return null;
        }

        return (await saveSheet(id, body)).version;
      },
      fetch: async () => toServerState(await fetchSheet(id)),
      merge: mergeSheetSnapshots,
      isConflict: isVersionConflict,
      onStatus: (status) => {
        if (saveQueue === queue) {
          saveStatus.value = status;
        }
      },
      onSnapshot: (snapshot) => {
        // Хвост прошлого листа в открытый сейчас лист не попадает
        if (saveQueue === queue) {
          name.value = snapshot.name;
          document.value = snapshot.data;
        }
      },
      onError: (error) => {
        toast.add({
          title: getApiErrorMessage(error, SHEET_TEXT.errorSave),
          color: 'error',
        });
      },
    });

    return queue;
  }

  /**
   * Подставляет лист с сервера и заводит ему очередь сохранения.
   * @param sheet - лист из ответа
   * @param keepPending - досылать ли несохранённое прошлого листа
   */
  function apply(sheet: CharacterSheet, keepPending: boolean): void {
    replaceQueue(createQueue(sheet.id, toServerState(sheet)), keepPending);
    sheetId.value = sheet.id;
    name.value = sheet.name;
    document.value = sheet.data;
    shareToken.value = sheet.shareToken;
    isEditor.value = sheet.editor;
  }

  /**
   * Загружает лист.
   * @param id - идентификатор листа
   * @param keepPending - досылать ли несохранённое прошлого листа; при
   *   перезагрузке после конфликта свои правки сознательно отбрасываются
   */
  async function load(id: string, keepPending = true): Promise<void> {
    loadStatus.value = 'pending';
    saveStatus.value = 'idle';
    sharedToken.value = null;
    sharedInfo.value = null;
    isEditor.value = false;

    try {
      apply(await fetchSheet(id), keepPending);
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
    sharedToken.value = token;
    sharedInfo.value = null;
    isEditor.value = false;
    replaceQueue(null, true);

    try {
      const shared = await fetchSharedSheet(token);

      sheetId.value = shared.id;
      name.value = shared.name;
      document.value = shared.data;
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

  /** Сообщает очереди сохранения о правке. */
  function track(): void {
    saveQueue?.track({ name: name.value, data: document.value });
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
    track();
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
    track();
  }

  /**
   * Перечитывает лист с сервера; несохранённые правки отбрасываются — так
   * выходят из конфликта, который не удалось слить.
   */
  async function reload(): Promise<void> {
    if (sharedToken.value) {
      await loadShared(sharedToken.value);

      return;
    }

    if (sheetId.value) {
      await load(sheetId.value, false);
    }
  }

  /**
   * Версия листа на сервере известна по отметке присутствия: если она новее
   * своей, лист сохранил кто-то ещё, и его правки сливаются со своими.
   * @param remoteVersion - версия листа на сервере
   */
  function syncRemote(remoteVersion: number): void {
    void saveQueue?.syncRemote(remoteVersion);
  }

  /** Уход со страницы: несохранённое уходит запросом, который переживёт её. */
  function flushOnLeave(): void {
    if (saveQueue?.hasPending() && !saveQueue.isSaving()) {
      void saveQueue.flush({ keepalive: true });
    }
  }

  /**
   * Забывает несохранённые правки: лист удалён или право на правку отозвано,
   * и сохранять их некуда.
   */
  function discardChanges(): void {
    saveQueue?.discard();
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
    isEditor,
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
    syncRemote,
    update,
    rename,
    discardChanges,
  };
});
