import type {
  SavedSheetEditAccess,
  SheetSaveQueueDeps,
  SheetSaveStatus,
  SheetServerState,
  SheetSnapshot,
} from '~character-sheet/model';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  characterSheetListSchema,
  characterSheetSchema,
  createEmptySheetDocument,
  createSheetSaveQueue,
  getEditAccessChanges,
  getPresenceInterval,
  getSavedSheetEditAction,
  getSaveRetryDelay,
  isEditAccessLostStatus,
  mergeSheetSnapshots,
  mergeSheetValues,
  requestSheetEdit,
  savedSheetEditAccessListSchema,
  savedSheetSchema,
  sendSheetPresence,
  SHEET_PRESENCE_INTERVAL_MS,
  SHEET_PRESENCE_SHARED_INTERVAL_MS,
  SHEET_SAVE_DELAY,
  SHEET_SAVE_RETRY_LIMIT,
  sheetEditorListSchema,
  sheetEditRequestCountSchema,
  sheetPresenceSchema,
} from '~character-sheet/model';

/** Отказ сервера «лист изменён в другом месте». */
const CONFLICT = new Error('conflict');

/**
 * Снимок листа для тестов.
 * @param name - имя персонажа
 * @param current - текущие хиты
 */
function createSnapshot(name: string, current = 10): SheetSnapshot {
  const data = createEmptySheetDocument();

  return { name, data: { ...data, health: { ...data.health, current } } };
}

/** Что видно вокруг очереди: сервер, шапка листа и сам открытый лист. */
interface HarnessState {
  statuses: Array<SheetSaveStatus>;
  snapshots: Array<SheetSnapshot>;
  saved: Array<{ snapshot: SheetSnapshot; version: number }>;
  errors: Array<unknown>;
  /** Лист на сервере; без него сервер недоступен. */
  server: SheetServerState | undefined;
}

/**
 * Сервер и лист вокруг одной очереди.
 * @param initial - лист при загрузке
 */
function createHarness(initial: SheetSnapshot = createSnapshot('Торин')) {
  const state: HarnessState = {
    statuses: [],
    snapshots: [],
    saved: [],
    errors: [],
    server: undefined,
  };

  const save = vi.fn<SheetSaveQueueDeps['save']>((snapshot, version) => {
    state.saved.push({ snapshot, version });

    return Promise.resolve(version + 1);
  });

  const deps: SheetSaveQueueDeps = {
    save,
    fetch: () =>
      state.server
        ? Promise.resolve(state.server)
        : Promise.reject(new Error('Сервер недоступен')),
    merge: mergeSheetSnapshots,
    isConflict: (error) => error === CONFLICT,
    onStatus: (status) => {
      state.statuses.push(status);
    },
    onSnapshot: (snapshot) => {
      state.snapshots.push(snapshot);
    },
    onError: (error) => {
      state.errors.push(error);
    },
  };

  const queue = createSheetSaveQueue({ snapshot: initial, version: 1 }, deps);

  return { state, save, queue };
}

/** Ждёт паузу после правки и даёт отправке завершиться. */
async function passDebounce(): Promise<void> {
  await vi.advanceTimersByTimeAsync(SHEET_SAVE_DELAY);
}

describe('слияние одновременных правок листа', () => {
  it('правки разных полей складываются', () => {
    const base = { name: 'Гимли', hp: 10, notes: { text: '' } };
    const mine = { name: 'Гимли', hp: 7, notes: { text: '' } };
    const theirs = { name: 'Гимли', hp: 10, notes: { text: 'Топор' } };

    expect(mergeSheetValues(base, mine, theirs)).toEqual({
      name: 'Гимли',
      hp: 7,
      notes: { text: 'Топор' },
    });
  });

  it('одну и ту же строку поменяли оба — побеждает своя правка', () => {
    expect(
      mergeSheetValues(
        { name: 'Гимли' },
        { name: 'Гимли II' },
        { name: 'Гном' },
      ),
    ).toEqual({ name: 'Гимли II' });
  });

  it('одновременные «+1» к одному числу складываются', () => {
    const base = { abilities: { strength: 10 }, slots: [{ used: 0 }] };
    const mine = { abilities: { strength: 11 }, slots: [{ used: 1 }] };
    const theirs = { abilities: { strength: 11 }, slots: [{ used: 1 }] };

    expect(mergeSheetValues(base, mine, theirs)).toEqual({
      abilities: { strength: 12 },
      slots: [{ used: 2 }],
    });
  });

  it('списки с id сливаются поэлементно', () => {
    const base = [
      { id: 'a', count: 1 },
      { id: 'b', count: 1 },
    ];

    const mine = [
      { id: 'a', count: 2 },
      { id: 'b', count: 1 },
      { id: 'c', count: 1 },
    ];

    const theirs = [
      { id: 'a', count: 1 },
      { id: 'b', count: 3 },
      { id: 'd', count: 1 },
    ];

    expect(mergeSheetValues(base, mine, theirs)).toEqual([
      { id: 'a', count: 2 },
      { id: 'b', count: 3 },
      { id: 'd', count: 1 },
      { id: 'c', count: 1 },
    ]);
  });

  it('удаление побеждает только нетронутый элемент', () => {
    const base = [
      { id: 'a', count: 1 },
      { id: 'b', count: 1 },
    ];

    // Сам удалил «a», а на сервере «a» не трогали, зато удалили «b», который
    // я успел поправить
    const mine = [{ id: 'b', count: 2 }];
    const theirs = [{ id: 'a', count: 1 }];

    expect(mergeSheetValues(base, mine, theirs)).toEqual([
      { id: 'b', count: 2 },
    ]);
  });

  it('списки объектов разной длины берутся целиком своими', () => {
    expect(
      mergeSheetValues(
        [{ used: 0 }],
        [{ used: 1 }, { used: 0 }],
        [{ used: 2 }],
      ),
    ).toEqual([{ used: 1 }, { used: 0 }]);
  });

  it('удалённый с одной стороны ключ остаётся, если другая его поправила', () => {
    expect(mergeSheetValues({ a: 1, b: 1 }, { a: 1 }, { a: 1, b: 2 })).toEqual({
      a: 1,
      b: 2,
    });

    expect(mergeSheetValues({ a: 1, b: 1 }, { a: 1 }, { a: 1, b: 1 })).toEqual({
      a: 1,
    });
  });

  it('лист после слияния проходит схему: имя и документ сливаются', () => {
    const base = createSnapshot('Гимли', 10);
    const mine = { ...createSnapshot('Гимли II', 10) };

    const theirs = {
      ...base,
      data: { ...base.data, inspiration: true },
    };

    const merged = mergeSheetSnapshots(base, mine, theirs);

    expect(merged.name).toBe('Гимли II');
    expect(merged.data.inspiration).toBe(true);
    expect(merged.data.health.current).toBe(10);
  });
});

describe('очередь сохранения листа', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('правка уходит одним запросом после паузы, с версией листа', async () => {
    const { state, save, queue } = createHarness();

    queue.track(createSnapshot('Торин', 8));
    queue.track(createSnapshot('Торин', 5));

    expect(save).not.toHaveBeenCalled();
    expect(state.statuses.at(-1)).toBe('pending');

    await passDebounce();

    expect(save).toHaveBeenCalledTimes(1);
    expect(state.saved[0]?.snapshot.data.health.current).toBe(5);
    expect(state.saved[0]?.version).toBe(1);
    expect(queue.getVersion()).toBe(2);
    expect(state.statuses.at(-1)).toBe('saved');
    expect(queue.hasPending()).toBe(false);
  });

  it('снимок, равный сохранённому, не отправляется', async () => {
    const { save, queue } = createHarness();

    queue.track(createSnapshot('Торин', 10));
    await passDebounce();

    expect(save).not.toHaveBeenCalled();
  });

  it('сбой повторяется с растущей паузой и не дольше предела попыток', async () => {
    const { state, save, queue } = createHarness();

    save.mockRejectedValue(new Error('Сервер недоступен'));

    queue.track(createSnapshot('Торин', 5));
    await passDebounce();

    expect(save).toHaveBeenCalledTimes(1);

    for (let i = 0; i < SHEET_SAVE_RETRY_LIMIT; i++) {
      await vi.advanceTimersByTimeAsync(getSaveRetryDelay(i));
    }

    expect(save).toHaveBeenCalledTimes(1 + SHEET_SAVE_RETRY_LIMIT);

    await vi.advanceTimersByTimeAsync(
      getSaveRetryDelay(SHEET_SAVE_RETRY_LIMIT),
    );

    expect(save).toHaveBeenCalledTimes(1 + SHEET_SAVE_RETRY_LIMIT);
    expect(state.statuses.at(-1)).toBe('error');
    // О сбое серии сообщают один раз, повторы молчат
    expect(state.errors).toHaveLength(1);
    expect(queue.hasPending()).toBe(true);
  });

  it('ручной повтор досылает правку после сбоя', async () => {
    const { state, save, queue } = createHarness();

    save.mockRejectedValueOnce(new Error('Сервер недоступен'));

    queue.track(createSnapshot('Торин', 5));
    await passDebounce();

    queue.retry();
    await vi.advanceTimersByTimeAsync(0);

    expect(state.saved.at(-1)?.snapshot.data.health.current).toBe(5);
    expect(queue.hasPending()).toBe(false);
    expect(state.statuses.at(-1)).toBe('saved');
  });

  it('конфликт: свои правки сливаются с листом сервера и уходят заново', async () => {
    const { state, save, queue } = createHarness();

    // Сервер тем временем принял чужую правку: другое имя, версия 5
    state.server = {
      snapshot: createSnapshot('Торин Дубощит', 10),
      version: 5,
    };

    save.mockRejectedValueOnce(CONFLICT);

    queue.track(createSnapshot('Торин', 4));
    await passDebounce();

    // Лист показывает слитый снимок: чужое имя и свои хиты
    expect(state.snapshots.at(-1)?.name).toBe('Торин Дубощит');
    expect(state.snapshots.at(-1)?.data.health.current).toBe(4);
    expect(queue.getVersion()).toBe(5);

    await passDebounce();

    expect(state.saved.at(-1)?.snapshot.name).toBe('Торин Дубощит');
    expect(state.saved.at(-1)?.snapshot.data.health.current).toBe(4);
    expect(state.saved.at(-1)?.version).toBe(5);
    expect(queue.hasPending()).toBe(false);
    expect(state.statuses).not.toContain('conflict');
  });

  it('конфликт без доступа к серверу показывается и повторяется', async () => {
    const { state, save, queue } = createHarness();

    save.mockRejectedValueOnce(CONFLICT);

    queue.track(createSnapshot('Торин', 4));
    await passDebounce();

    expect(state.statuses.at(-1)).toBe('conflict');
    expect(queue.hasPending()).toBe(true);

    // Сервер снова доступен: повтор перечитывает лист через новый конфликт
    state.server = { snapshot: createSnapshot('Торин', 10), version: 3 };
    save.mockRejectedValueOnce(CONFLICT);

    await vi.advanceTimersByTimeAsync(getSaveRetryDelay(0));
    await passDebounce();

    expect(state.saved.at(-1)?.version).toBe(3);
    expect(state.saved.at(-1)?.snapshot.data.health.current).toBe(4);
    expect(state.statuses.at(-1)).toBe('saved');
  });

  it('чужая версия на сервере подтягивается без своих правок', async () => {
    const { state, save, queue } = createHarness();

    state.server = { snapshot: createSnapshot('Торин', 2), version: 3 };

    await queue.syncRemote(3);

    expect(state.snapshots.at(-1)?.data.health.current).toBe(2);
    expect(queue.getVersion()).toBe(3);
    expect(save).not.toHaveBeenCalled();

    // Та же или более старая версия — запросов нет
    await queue.syncRemote(3);

    expect(state.snapshots).toHaveLength(1);
  });

  it('чужая версия сливается с несохранёнными правками', async () => {
    const { state, queue } = createHarness();

    queue.track(createSnapshot('Торин', 6));

    state.server = { snapshot: createSnapshot('Торин II', 10), version: 2 };

    await queue.syncRemote(2);

    expect(state.snapshots.at(-1)).toMatchObject({ name: 'Торин II' });
    expect(state.snapshots.at(-1)?.data.health.current).toBe(6);

    await passDebounce();

    expect(state.saved.at(-1)?.version).toBe(2);
    expect(state.saved.at(-1)?.snapshot.name).toBe('Торин II');
  });

  it('закрытый лист досылает хвост, но в открытый лист его не кладёт', async () => {
    const { state, queue } = createHarness();

    queue.track(createSnapshot('Торин', 6));
    queue.detach();
    await vi.advanceTimersByTimeAsync(0);

    expect(state.saved).toHaveLength(1);
    expect(state.saved[0]?.snapshot.data.health.current).toBe(6);
    expect(queue.hasPending()).toBe(false);

    state.server = { snapshot: createSnapshot('Торин', 1), version: 9 };
    await queue.syncRemote(9);

    expect(state.snapshots).toHaveLength(0);
  });

  it('забытые правки не отправляются', async () => {
    const { save, queue } = createHarness();

    queue.track(createSnapshot('Торин', 6));
    queue.discard();
    await passDebounce();

    expect(save).not.toHaveBeenCalled();
    expect(queue.hasPending()).toBe(false);
  });

  it('правка во время отправки уходит следующим запросом', async () => {
    const { state, save, queue } = createHarness();

    queue.track(createSnapshot('Торин', 8));

    let finishFirst: (version: number) => void = () => undefined;

    save.mockImplementationOnce((snapshot, version) => {
      state.saved.push({ snapshot, version });

      return new Promise<number>((resolve) => {
        finishFirst = resolve;
      });
    });

    await passDebounce();

    queue.track(createSnapshot('Торин', 2));
    finishFirst(2);
    await passDebounce();

    expect(state.saved).toHaveLength(2);
    expect(state.saved[1]?.snapshot.data.health.current).toBe(2);
    expect(state.saved[1]?.version).toBe(2);
    expect(queue.hasPending()).toBe(false);
  });
});

describe('права на редактирование листа', () => {
  const sheetBase = {
    id: 's1',
    name: 'Гимли',
    data: {},
    version: 1,
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-01T10:00:00Z',
  };

  it('лист редактора помечен, старый ответ — свой без запросов', () => {
    expect(
      characterSheetSchema.parse({
        ...sheetBase,
        editor: true,
        pendingEditRequests: 2,
      }),
    ).toMatchObject({ editor: true, pendingEditRequests: 2 });

    expect(characterSheetSchema.parse(sheetBase)).toMatchObject({
      editor: false,
      pendingEditRequests: 0,
    });
  });

  it('метка запросов приходит в списке и не ломает старый ответ', () => {
    const list = characterSheetListSchema.parse({
      items: [{ ...sheetBase, pendingEditRequests: 2 }, sheetBase],
      used: 2,
      limit: 8,
    });

    expect(list.items.map((sheet) => sheet.pendingEditRequests)).toEqual([
      2, 0,
    ]);
  });

  it('незнакомое право у сохранённого листа считается незапрошенным', () => {
    const base = {
      id: 'r1',
      sheetId: 's1',
      shareToken: 't1',
      name: 'Гимли',
      data: {},
      available: true,
    };

    expect(
      savedSheetSchema.parse({ ...base, editStatus: 'APPROVED' }).editStatus,
    ).toBe('APPROVED');

    expect(
      savedSheetSchema.parse({ ...base, editStatus: 'OWNER' }).editStatus,
    ).toBeNull();

    expect(savedSheetSchema.parse(base).editStatus).toBeNull();
  });

  it('сводка прав, редакторы, запросы и присутствие разбираются', () => {
    expect(
      savedSheetEditAccessListSchema.parse({
        sheets: [
          { savedId: 'r1', sheetId: 's1', name: 'Гимли', status: 'PENDING' },
          { savedId: 'r2', sheetId: 's2', name: 'Битый', status: 'OWNER' },
        ],
      }).sheets,
    ).toEqual([
      { savedId: 'r1', sheetId: 's1', name: 'Гимли', status: 'PENDING' },
    ]);

    const editors = sheetEditorListSchema.parse({
      limit: 5,
      editors: [
        {
          id: 'e1',
          displayName: 'Мастер',
          status: 'PENDING',
          requestedAt: '2026-10-09T10:00:00Z',
        },
      ],
    });

    expect(editors.limit).toBe(5);
    expect(editors.editors[0]?.status).toBe('PENDING');
    expect(sheetEditRequestCountSchema.parse({ count: 3 }).count).toBe(3);
    expect(sheetEditRequestCountSchema.parse({}).count).toBe(0);

    expect(
      sheetPresenceSchema.parse({
        users: [{ displayName: 'Мастер' }],
        version: 4,
      }),
    ).toEqual({ users: [{ displayName: 'Мастер' }], version: 4 });

    expect(sheetPresenceSchema.parse({})).toEqual({ users: [], version: null });
  });

  it('пункт запроса в меню сохранённого листа зависит от права', () => {
    expect(getSavedSheetEditAction(null)).toBe('request');
    expect(getSavedSheetEditAction('PENDING')).toBe('pending');
    expect(getSavedSheetEditAction('APPROVED')).toBeNull();
  });

  it('ответы владельцев: разрешение и отказ узнаются по смене сводки', () => {
    const pending: SavedSheetEditAccess = {
      savedId: 'r1',
      sheetId: 's1',
      name: 'Гимли',
      status: 'PENDING',
    };

    const other: SavedSheetEditAccess = {
      savedId: 'r2',
      sheetId: 's2',
      name: 'Леголас',
      status: 'PENDING',
    };

    const approved: SavedSheetEditAccess = { ...pending, status: 'APPROVED' };

    // Первая сводка — точка отсчёта, о прежних разрешениях не сообщаем
    expect(getEditAccessChanges(null, [approved])).toEqual({
      granted: [],
      declined: [],
    });

    expect(getEditAccessChanges([pending, other], [approved])).toEqual({
      granted: [approved],
      declined: [other],
    });

    // Уже выданное право новым не считается
    expect(getEditAccessChanges([approved], [approved]).granted).toEqual([]);
  });

  it('отметка присутствия чаще, когда на листе кто-то ещё или у редактора', () => {
    expect(getPresenceInterval(0, false)).toBe(SHEET_PRESENCE_INTERVAL_MS);

    expect(getPresenceInterval(1, false)).toBe(
      SHEET_PRESENCE_SHARED_INTERVAL_MS,
    );

    expect(getPresenceInterval(0, true)).toBe(
      SHEET_PRESENCE_SHARED_INTERVAL_MS,
    );
  });

  it('право потеряно только при отказе по самому листу', () => {
    expect(isEditAccessLostStatus(403)).toBe(true);
    expect(isEditAccessLostStatus(404)).toBe(true);
    expect(isEditAccessLostStatus(500)).toBe(false);
    expect(isEditAccessLostStatus(undefined)).toBe(false);
  });
});

describe('ручки совместной правки', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('запрос правок уходит POST по записи «Других листов»', async () => {
    const api = vi.fn(() => Promise.resolve({ status: 'PENDING' }));

    vi.stubGlobal('useApi', () => api);

    await expect(requestSheetEdit('r 1')).resolves.toBe('PENDING');

    expect(api).toHaveBeenCalledWith(
      '/api/v1/character-sheets/saved/r%201/edit-request',
      { method: 'POST' },
    );
  });

  it('отметка присутствия читает версию и тех, кто ещё на листе', async () => {
    const api = vi.fn(() =>
      Promise.resolve({ users: [{ displayName: 'Мастер' }], version: 7 }),
    );

    vi.stubGlobal('useApi', () => api);

    await expect(sendSheetPresence('s1')).resolves.toEqual({
      users: [{ displayName: 'Мастер' }],
      version: 7,
    });

    expect(api).toHaveBeenCalledWith('/api/v1/character-sheets/s1/presence', {
      method: 'POST',
    });
  });
});
