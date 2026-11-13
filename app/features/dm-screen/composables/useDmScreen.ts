import type {
  DmScreenCache,
  DmScreenPoint,
  DmScreenRect,
  DmScreenRequest,
  DmScreenTile,
  DmScreenViewport,
  DmScreenWindow,
} from '../model';

import { isEqual, sortBy } from 'es-toolkit';

import { LAYOUT_DRAWER_QUERY } from '~/shared/consts';
import { getApiErrorMessage } from '~user/model';

import {
  appendDmScreenWindow,
  arrangeDmScreenWindows,
  createDmScreenNotePath,
  DM_SCREEN_CACHE_STORAGE_KEY,
  DM_SCREEN_HIGHLIGHT_DURATION,
  DM_SCREEN_SAVE_DELAY,
  DM_SCREEN_STORAGE_KEY,
  DM_SCREEN_TEXT,
  DM_SCREEN_TOP_INSET,
  dmScreenCacheSchema,
  dmScreenWindowListSchema,
  isDmScreenNotePath,
  saveDmScreenWindows,
  saveDmScreenWindowsOnLeave,
} from '../model';

/** Изменяемые поля окна. */
type DmScreenWindowPatch = Partial<Omit<DmScreenWindow, 'id'>>;

/**
 * Читает сохранённые окна; чужой формат или битый JSON — пустой список.
 * @param raw - строка из localStorage
 */
function readWindows(raw: string): Array<DmScreenWindow> {
  try {
    const parsed = dmScreenWindowListSchema.safeParse(JSON.parse(raw));

    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

/**
 * Читает копию ширмы из аккаунта; чужой формат или битый JSON — копии нет.
 * @param raw - строка из localStorage
 */
function readCache(raw: string): DmScreenCache | null {
  try {
    const parsed = dmScreenCacheSchema.safeParse(JSON.parse(raw));

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Открытая ширма Мастера: записи сайта, разложенные окнами. Окна берутся из
 * одного из двух мест. У гостя ширма одна и лежит в localStorage. У
 * пользователя ширм несколько и они на сервере: страница ширмы
 * подключает открытую (`attach`), её изменения сохраняются с паузой, а при
 * уходе со страницы — сразу. Окна есть на экранах, где помещаются рядом с
 * контентом; на телефоне ширма — список записей.
 */
export const useDmScreen = createSharedComposable(() => {
  const toast = useToast();

  // Читается после монтирования: иначе отметки добавленных записей в
  // браузере разошлись бы с разметкой сервера
  const localWindows = useLocalStorage<Array<DmScreenWindow>>(
    DM_SCREEN_STORAGE_KEY,
    [],
    {
      initOnMounted: true,
      serializer: {
        read: readWindows,
        write: (value) => JSON.stringify(value),
      },
    },
  );

  /**
   * Копия ширмы из аккаунта: после обновления страницы ширма открывается с
   * неё сразу, а ответ сервера приходит следом. Читается сразу, не после
   * монтирования: ширма рисуется только в браузере, и копия нужна уже при
   * создании страницы.
   */
  const cachedScreen = useLocalStorage<DmScreenCache | null>(
    DM_SCREEN_CACHE_STORAGE_KEY,
    null,
    {
      serializer: {
        read: readCache,
        write: (value) => JSON.stringify(value),
      },
    },
  );

  /** Открытая ширма с сервера; без неё окна — гостевые из браузера. */
  const screenId = ref<string>();

  const remoteWindows = shallowRef<Array<DmScreenWindow>>([]);

  /** Есть изменения, ещё не ушедшие на сервер. */
  let isDirty = false;

  /** Окна открытой ширмы меняли с тех пор, как её подключили. */
  let isTouched = false;

  /**
   * Сохраняет окна открытой ширмы, если они менялись.
   * @param id - ширма, чьи окна сохраняются
   */
  async function save(id = screenId.value): Promise<void> {
    if (!id || !isDirty) {
      return;
    }

    isDirty = false;

    try {
      await saveDmScreenWindows(id, remoteWindows.value);
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, DM_SCREEN_TEXT.errorSave),
        color: 'error',
      });
    }
  }

  const saveLater = useDebounceFn(() => save(), DM_SCREEN_SAVE_DELAY);

  const windows = computed<Array<DmScreenWindow>>({
    get: () => (screenId.value ? remoteWindows.value : localWindows.value),
    set: (value) => {
      if (!screenId.value) {
        localWindows.value = value;

        return;
      }

      remoteWindows.value = value;
      isDirty = true;
      isTouched = true;
      void saveLater();
    },
  });

  /**
   * Подключает ширму с сервера: дальше окна читаются и пишутся в неё.
   * Ширма, уже открытая с копии из браузера, окна не теряет: если их
   * успели изменить, правки новее ответа сервера, а одинаковые окна
   * заново не рисуются.
   * @param id - идентификатор ширмы
   * @param initial - окна ширмы с сервера или из копии в браузере
   */
  function attach(id: string, initial: ReadonlyArray<DmScreenWindow>): void {
    if (
      screenId.value === id
      && (isTouched || isEqual(remoteWindows.value, initial))
    ) {
      return;
    }

    screenId.value = id;
    remoteWindows.value = [...initial];
    isDirty = false;
    isTouched = false;
  }

  /** Отключает ширму с сервера, досохранив изменения. */
  function detach(): void {
    void save();

    screenId.value = undefined;
    remoteWindows.value = [];
    isTouched = false;
  }

  /**
   * Досохраняет изменения, когда страницу закрывают или прячут: обычный
   * запрос браузер может оборвать.
   */
  function saveOnLeave(): void {
    if (!screenId.value || !isDirty) {
      return;
    }

    isDirty = false;
    saveDmScreenWindowsOnLeave(screenId.value, remoteWindows.value);
  }

  /** Убирает гостевую ширму из браузера: её перенесли в аккаунт или удалили. */
  function clearLocal(): void {
    localWindows.value = [];
  }

  const isWindowed = useMediaQuery(LAYOUT_DRAWER_QUERY);

  const { width: viewportWidth, height: viewportHeight } = useWindowSize();

  /** Нижний край шапки ширмы: его сообщает холст, когда меряет шапку. */
  const topInset = ref<number>(DM_SCREEN_TOP_INSET);

  /** Экран ширмы: размер окна браузера и место, занятое шапкой. */
  const viewport = computed<DmScreenViewport>(() => ({
    width: viewportWidth.value,
    height: viewportHeight.value,
    top: topInset.value,
  }));

  /**
   * Запоминает, где кончается шапка ширмы; без значения — обычная высота.
   * @param value - нижний край шапки, px
   */
  function setTopInset(value: number = DM_SCREEN_TOP_INSET): void {
    topInset.value = value;
  }

  /** Окно, на которое указали вместо нового: недолго подсвечивается. */
  const highlightedId = refAutoReset<string | undefined>(
    undefined,
    DM_SCREEN_HIGHLIGHT_DURATION,
  );

  const topLayer = computed(() =>
    windows.value.reduce((top, item) => Math.max(top, item.layer), 0),
  );

  const visibleWindows = computed(() =>
    windows.value.filter((item) => !item.isMinimized),
  );

  const minimizedWindows = computed(() =>
    windows.value.filter((item) => item.isMinimized),
  );

  /**
   * Меняет поля окна.
   * @param id - окно
   * @param patch - новые значения полей
   */
  function update(id: string, patch: DmScreenWindowPatch): void {
    windows.value = windows.value.map((item) =>
      item.id === id ? { ...item, ...patch } : item,
    );
  }

  /**
   * Место и размер окон, пока их меняют за общую границу: окна показывают
   * их сразу, а в ширму они пишутся один раз, когда границу отпускают.
   */
  const previewRects = shallowRef<ReadonlyMap<string, DmScreenRect>>(new Map());

  /**
   * Показывает окна на новых местах, не записывая их; без окон — убирает
   * предпросмотр.
   * @param tiles - окна с новым местом и размером
   */
  function setPreviewRects(tiles: ReadonlyArray<DmScreenTile> = []): void {
    previewRects.value = new Map(tiles.map((tile) => [tile.id, tile]));
  }

  /**
   * Записывает место и размер нескольких окон одним изменением ширмы.
   * @param tiles - окна с новым местом и размером
   */
  function updateRects(tiles: ReadonlyArray<DmScreenTile>): void {
    const rects = new Map(tiles.map((tile) => [tile.id, tile]));

    windows.value = windows.value.map((screenWindow) => {
      const rect = rects.get(screenWindow.id);

      return rect
        ? {
            ...screenWindow,
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          }
        : screenWindow;
    });
  }

  /**
   * Поднимает окно над остальными.
   * @param id - окно
   */
  function focus(id: string): void {
    const target = windows.value.find((item) => item.id === id);

    // Окно уже сверху: запись в localStorage не нужна
    if (!target || target.layer === topLayer.value) {
      return;
    }

    update(id, { layer: topLayer.value + 1 });
  }

  /**
   * Добавляет запись в ширму окном. Уже добавленная запись не дублируется:
   * её окно разворачивается и встаёт сверху.
   * @param request - запись, название и точка клика
   * @returns добавлена ли новая запись
   */
  function add(request: DmScreenRequest): boolean {
    const result = appendDmScreenWindow(
      windows.value,
      request,
      viewport.value,
      crypto.randomUUID(),
    );

    windows.value = result.windows;

    return result.isAdded;
  }

  /**
   * Кладёт на ширму пустую заметку окном рядом с местом клика. Если пустая
   * заметка уже есть, новая не создаётся: та разворачивается, встаёт сверху
   * и подсвечивается — иначе пустые заметки копились бы.
   * @param origin - точка клика
   */
  function addNote(origin?: DmScreenPoint): void {
    const draft = windows.value.find(
      (screenWindow) =>
        isDmScreenNotePath(screenWindow.path) && !screenWindow.content?.trim(),
    );

    if (draft) {
      update(draft.id, { isMinimized: false, layer: topLayer.value + 1 });
      highlightedId.value = draft.id;

      return;
    }

    const id = crypto.randomUUID();

    add({
      path: createDmScreenNotePath(id),
      title: DM_SCREEN_TEXT.noteTitle,
      origin,
    });
  }

  /**
   * Открывает в окне другую запись: вкладку класса, подрасу и т. п.
   * @param id - окно
   * @param path - адрес записи
   */
  function navigate(id: string, path: string): void {
    update(id, { path });
  }

  /**
   * Убирает запись из ширмы.
   * @param id - окно
   */
  function close(id: string): void {
    windows.value = windows.value.filter((item) => item.id !== id);
  }

  /** Убирает с ширмы все окна и заметки. */
  function clear(): void {
    windows.value = [];
  }

  /**
   * Сворачивает окно в плашку внизу экрана.
   * @param id - окно
   */
  function minimize(id: string): void {
    update(id, { isMinimized: true });
  }

  /** Сворачивает все окна в плашки: холст освобождается целиком. */
  function minimizeAll(): void {
    windows.value = windows.value.map((item) => ({
      ...item,
      isMinimized: true,
    }));
  }

  /** Разворачивает все свёрнутые окна на их прежних местах. */
  function restoreAll(): void {
    windows.value = windows.value.map((item) => ({
      ...item,
      isMinimized: false,
    }));
  }

  /**
   * Разворачивает свёрнутое окно поверх остальных.
   * @param id - окно
   */
  function restore(id: string): void {
    update(id, { isMinimized: false, layer: topLayer.value + 1 });
  }

  /**
   * Раскладывает все окна ровной сеткой, свёрнутые тоже разворачиваются.
   * Порядок — как окна стоят сейчас (сверху вниз, слева направо), свёрнутые
   * встают в конец, чтобы раскладка не перемешивала окна.
   */
  function arrange(): void {
    const ordered = sortBy(windows.value, ['isMinimized', 'y', 'x']);

    const tiles = new Map(
      arrangeDmScreenWindows(
        ordered.map((item) => item.id),
        viewport.value,
      ).map((tile) => [tile.id, tile]),
    );

    windows.value = windows.value.map((item) => {
      const tile = tiles.get(item.id);

      return tile
        ? {
            ...item,
            x: tile.x,
            y: tile.y,
            width: tile.width,
            height: tile.height,
            isMinimized: false,
          }
        : item;
    });
  }

  /**
   * Есть ли запись в ширме, в том числе в свёрнутом окне.
   * @param path - адрес записи
   */
  function isAdded(path: string): boolean {
    return windows.value.some((item) => item.path === path);
  }

  return {
    isWindowed,
    screenId: readonly(screenId),
    // Не `readonly`: у ссылки на localStorage тип записи шире типа чтения
    // (допускает `null` для удаления ключа), и обёртка отдала бы наружу его
    localWindows: computed<ReadonlyArray<DmScreenWindow>>(
      () => localWindows.value,
    ),
    windows,
    cachedScreen,
    attach,
    detach,
    saveOnLeave,
    clearLocal,
    viewport,
    setTopInset,
    highlightedId: readonly(highlightedId),
    visibleWindows,
    minimizedWindows,
    add,
    addNote,
    arrange,
    navigate,
    close,
    clear,
    minimize,
    minimizeAll,
    restore,
    restoreAll,
    focus,
    update,
    updateRects,
    previewRects: shallowReadonly(previewRects),
    setPreviewRects,
    isAdded,
  };
});
