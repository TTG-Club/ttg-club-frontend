import type { DmScreenRequest, DmScreenWindow } from '../model';

import { sortBy } from 'es-toolkit';

import { LAYOUT_DRAWER_QUERY } from '~/shared/consts';

import {
  arrangeDmScreenWindows,
  DM_SCREEN_STORAGE_KEY,
  dmScreenWindowListSchema,
  fitDmScreenWindowSize,
  placeDmScreenWindow,
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
 * Ширма Мастера: записи сайта, разложенные окнами на странице ширмы. Какие
 * записи добавлены, где стоят их окна, какого они размера и свёрнуты ли,
 * лежит в localStorage: запись добавляют с любой страницы, а ширма
 * переживает перезагрузку. Окна есть на экранах, где помещаются рядом с
 * контентом; на телефоне ширма — список записей.
 */
export const useDmScreen = createSharedComposable(() => {
  // Читается после монтирования: иначе отметки добавленных записей в
  // браузере разошлись бы с разметкой сервера
  const windows = useLocalStorage<Array<DmScreenWindow>>(
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
    const existing = windows.value.find((item) => item.path === request.path);

    if (existing) {
      update(existing.id, {
        isMinimized: false,
        layer: topLayer.value + 1,
      });

      return false;
    }

    const viewport = {
      width: viewportWidth.value,
      height: viewportHeight.value,
    };

    const size = fitDmScreenWindowSize(viewport);

    const position = placeDmScreenWindow(
      viewport,
      size,
      request.origin,
      visibleWindows.value.length,
    );

    windows.value = [
      ...windows.value,
      {
        id: crypto.randomUUID(),
        path: request.path,
        title: request.title,
        ...position,
        ...size,
        layer: topLayer.value + 1,
        isMinimized: false,
      },
    ];

    return true;
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
   * Раскладывает развёрнутые окна ровной сеткой. Порядок — как окна стоят
   * сейчас (сверху вниз, слева направо), чтобы раскладка не перемешивала
   * их; свёрнутые окна остаются в плашках.
   */
  function arrange(): void {
    const ordered = sortBy(visibleWindows.value, ['y', 'x']);

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
    windows,
    visibleWindows,
    minimizedWindows,
    add,
    arrange,
    navigate,
    close,
    minimize,
    minimizeAll,
    restore,
    focus,
    update,
    isAdded,
  };
});
