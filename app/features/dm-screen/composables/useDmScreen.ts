import type { DmScreenRequest, DmScreenWindow } from '../model';

import { sortBy } from 'es-toolkit';

import { LAYOUT_DRAWER_QUERY } from '~/shared/consts';
import { getApiErrorMessage } from '~user/model';

import {
  appendDmScreenWindow,
  arrangeDmScreenWindows,
  DM_SCREEN_SAVE_DELAY,
  DM_SCREEN_STORAGE_KEY,
  DM_SCREEN_TEXT,
  DM_SCREEN_WINDOW_MIN_SIZE,
  dmScreenWindowListSchema,
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

  /** Открытая ширма с сервера; без неё окна — гостевые из браузера. */
  const screenId = ref<string>();

  const remoteWindows = shallowRef<Array<DmScreenWindow>>([]);

  /** Есть изменения, ещё не ушедшие на сервер. */
  let isDirty = false;

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
      void saveLater();
    },
  });

  /**
   * Подключает ширму с сервера: дальше окна читаются и пишутся в неё.
   * @param id - идентификатор ширмы
   * @param initial - окна ширмы с сервера
   */
  function attach(id: string, initial: ReadonlyArray<DmScreenWindow>): void {
    screenId.value = id;
    remoteWindows.value = [...initial];
    isDirty = false;
  }

  /** Отключает ширму с сервера, досохранив изменения. */
  function detach(): void {
    void save();

    screenId.value = undefined;
    remoteWindows.value = [];
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
      { width: viewportWidth.value, height: viewportHeight.value },
      crypto.randomUUID(),
    );

    windows.value = result.windows;

    return result.isAdded;
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

  /**
   * Сворачивает окно в плашку внизу экрана.
   * @param id - окно
   */
  function minimize(id: string): void {
    update(id, { isMinimized: true });
  }

  /**
   * Уменьшает все окна до минимального размера, не сдвигая их: на холсте
   * видно больше окон сразу. Свёрнутые окна тоже разворачиваются —
   * уменьшенными.
   */
  function shrinkAll(): void {
    windows.value = windows.value.map((item) => ({
      ...item,
      width: DM_SCREEN_WINDOW_MIN_SIZE.width,
      height: DM_SCREEN_WINDOW_MIN_SIZE.height,
      isMinimized: false,
    }));
  }

  /** Сворачивает все окна в плашки: холст освобождается целиком. */
  function minimizeAll(): void {
    windows.value = windows.value.map((item) => ({
      ...item,
      isMinimized: true,
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
        { width: viewportWidth.value, height: viewportHeight.value },
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
    attach,
    detach,
    saveOnLeave,
    clearLocal,
    visibleWindows,
    minimizedWindows,
    add,
    arrange,
    navigate,
    close,
    minimize,
    minimizeAll,
    shrinkAll,
    restore,
    focus,
    update,
    isAdded,
  };
});
