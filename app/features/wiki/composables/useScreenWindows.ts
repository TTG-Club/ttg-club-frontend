import type { ScreenWindowRequest, ScreenWindowState } from '../model';

import { LAYOUT_DRAWER_QUERY } from '~/shared/consts';

import {
  fitScreenWindowSize,
  placeScreenWindow,
  SCREEN_WINDOWS_STORAGE_KEY,
  screenWindowListSchema,
} from '../model';

/** Изменяемые поля окна. */
type ScreenWindowPatch = Partial<Omit<ScreenWindowState, 'id'>>;

/**
 * Читает сохранённые окна; чужой формат или битый JSON — пустой список.
 * @param raw - строка из localStorage
 */
function readWindows(raw: string): Array<ScreenWindowState> {
  try {
    const parsed = screenWindowListSchema.safeParse(JSON.parse(raw));

    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

/**
 * Окна ширмы поверх всего сайта, как разложенные листы бумажной ширмы:
 * открытые разделы, их место, размер и свёрнутость лежат в localStorage и
 * переживают переходы и перезагрузку. Окна есть только на экранах, где
 * помещаются рядом с контентом; на телефоне разделы открываются страницей.
 */
export const useScreenWindows = createSharedComposable(() => {
  // Читается после монтирования: иначе подсветка открытых разделов в
  // браузере разошлась бы с разметкой сервера
  const windows = useLocalStorage<Array<ScreenWindowState>>(
    SCREEN_WINDOWS_STORAGE_KEY,
    [],
    {
      initOnMounted: true,
      serializer: {
        read: readWindows,
        write: (value) => JSON.stringify(value),
      },
    },
  );

  const isAvailable = useMediaQuery(LAYOUT_DRAWER_QUERY);

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
  function update(id: string, patch: ScreenWindowPatch): void {
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
   * Открывает раздел в окне. Уже открытый раздел не дублируется: его окно
   * разворачивается и встаёт сверху.
   * @param request - раздел, название и точка клика
   */
  function open(request: ScreenWindowRequest): void {
    const existing = windows.value.find((item) => item.path === request.path);

    if (existing) {
      update(existing.id, {
        isMinimized: false,
        layer: topLayer.value + 1,
      });

      return;
    }

    const viewport = {
      width: viewportWidth.value,
      height: viewportHeight.value,
    };

    const size = fitScreenWindowSize(viewport);

    const position = placeScreenWindow(
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
        icon: request.icon,
        ...position,
        ...size,
        layer: topLayer.value + 1,
        isMinimized: false,
      },
    ];
  }

  /**
   * Закрывает окно.
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
   * Разворачивает свёрнутое окно поверх остальных.
   * @param id - окно
   */
  function restore(id: string): void {
    update(id, { isMinimized: false, layer: topLayer.value + 1 });
  }

  /**
   * Открыт ли раздел в окне, в том числе свёрнутом.
   * @param path - адрес раздела
   */
  function isOpen(path: string): boolean {
    return windows.value.some((item) => item.path === path);
  }

  return {
    isAvailable,
    visibleWindows,
    minimizedWindows,
    open,
    close,
    minimize,
    restore,
    focus,
    update,
    isOpen,
  };
});
