import type {
  DmScreenPoint,
  DmScreenRect,
  DmScreenSize,
  DmScreenView,
} from '../model';

import {
  centerDmScreenView,
  clampDmScreenView,
  clampDmScreenZoom,
  DM_SCREEN_CANVAS_INSET,
  DM_SCREEN_FIT_PADDING,
  DM_SCREEN_VIEW_DEFAULT,
  DM_SCREEN_VIEW_STORAGE_KEY,
  DM_SCREEN_ZOOM,
  dmScreenViewSchema,
  fitDmScreenView,
  getDmScreenBounds,
  getDmScreenRectCenter,
  getDmScreenVisibleRect,
  isDmScreenRectVisible,
  panDmScreenView,
  toDmScreenCanvasRect,
  toDmScreenFieldPoint,
  zoomDmScreenView,
} from '../model';

/**
 * Читает обзор, сохранённый в браузере; чужой формат или битый JSON —
 * обычный обзор. Масштаб возвращается в допустимые пределы.
 * @param storedText - строка из localStorage
 */
function readStoredView(storedText: string): DmScreenView {
  try {
    const storedView = dmScreenViewSchema.safeParse(JSON.parse(storedText));

    return storedView.success
      ? { ...storedView.data, zoom: clampDmScreenZoom(storedView.data.zoom) }
      : DM_SCREEN_VIEW_DEFAULT;
  } catch {
    return DM_SCREEN_VIEW_DEFAULT;
  }
}

/**
 * Обзор ширмы. Окна стоят на большом поле, а холст показывает его часть:
 * поле можно двигать во все стороны до его краёв и отдалять (ближе, чем
 * один к одному, оно не подходит). Здесь же перевод точек из окна браузера
 * на холст и на поле.
 *
 * Побочные действия: сдвиг и масштаб хранятся в localStorage — у каждого
 * браузера свой обзор, в аккаунт он не уходит.
 */
export const useDmScreenView = createSharedComposable(() => {
  const storedView = useLocalStorage<DmScreenView>(
    DM_SCREEN_VIEW_STORAGE_KEY,
    DM_SCREEN_VIEW_DEFAULT,
    {
      // Обзор меняется только заменой целиком
      shallow: true,
      serializer: {
        read: readStoredView,
        write: (nextView) => JSON.stringify(nextView),
      },
    },
  );

  const { width: viewportWidth, height: viewportHeight } = useWindowSize();

  /** Размер холста, который сообщила страница ширмы. */
  const measuredCanvas = shallowRef<DmScreenSize>();

  /** Левый верхний угол холста в окне браузера. */
  const canvasOrigin = shallowRef<DmScreenPoint>({ x: 0, y: 0 });

  /**
   * Размер холста на экране. Пока ширма не открыта (запись кладут с другой
   * страницы), он оценивается по окну браузера.
   */
  const canvas = computed<DmScreenSize>(
    () =>
      measuredCanvas.value ?? {
        width: viewportWidth.value - DM_SCREEN_CANVAS_INSET.width,
        height: viewportHeight.value - DM_SCREEN_CANVAS_INSET.height,
      },
  );

  // За края поля обзор не уходит; холст мог стать больше с прошлого раза,
  // поэтому сохранённый обзор сверяется с краями заново
  const view = computed<DmScreenView>({
    get: () => clampDmScreenView(storedView.value, canvas.value),
    set: (nextView) => {
      storedView.value = clampDmScreenView(nextView, canvas.value);
    },
  });

  /** Видимая часть поля: в ней встают новые окна и раскладки. */
  const board = computed<DmScreenRect>(() =>
    getDmScreenVisibleRect(view.value, canvas.value),
  );

  /**
   * Запоминает место и размер холста; без значений — холста больше нет.
   * @param rect - прямоугольник холста в окне браузера
   */
  function setCanvas(rect?: DmScreenRect): void {
    measuredCanvas.value = rect
      ? { width: rect.width, height: rect.height }
      : undefined;

    canvasOrigin.value = rect ? { x: rect.x, y: rect.y } : { x: 0, y: 0 };
  }

  /**
   * Точка холста по точке в окне браузера.
   * @param client - координаты указателя в окне браузера
   */
  function toCanvasPoint(client: DmScreenPoint): DmScreenPoint {
    return {
      x: client.x - canvasOrigin.value.x,
      y: client.y - canvasOrigin.value.y,
    };
  }

  /**
   * Точка поля по точке в окне браузера.
   * @param client - координаты указателя в окне браузера
   */
  function toBoardPoint(client: DmScreenPoint): DmScreenPoint {
    return toDmScreenFieldPoint(toCanvasPoint(client), view.value);
  }

  /**
   * Прямоугольник поля, как он сейчас виден на холсте.
   * @param rect - прямоугольник на поле
   */
  function toCanvasRect(rect: DmScreenRect): DmScreenRect {
    return toDmScreenCanvasRect(rect, view.value);
  }

  /**
   * Двигает поле за указателем.
   * @param from - обзор в начале жеста
   * @param delta - на сколько сдвинулся указатель на экране
   */
  function pan(from: DmScreenView, delta: DmScreenPoint): void {
    view.value = panDmScreenView(from, delta);
  }

  /**
   * Меняет масштаб; точка поля под якорем остаётся на месте.
   * @param zoom - желаемый масштаб
   * @param anchor - точка холста; без неё — его середина
   */
  function zoomTo(zoom: number, anchor?: DmScreenPoint): void {
    view.value = zoomDmScreenView(
      view.value,
      zoom,
      anchor ?? getDmScreenRectCenter({ x: 0, y: 0, ...canvas.value }),
    );
  }

  /** Приближает поле на шаг. */
  function zoomIn(): void {
    zoomTo(view.value.zoom * DM_SCREEN_ZOOM.step);
  }

  /** Отдаляет поле на шаг. */
  function zoomOut(): void {
    zoomTo(view.value.zoom / DM_SCREEN_ZOOM.step);
  }

  /** Возвращает обычный масштаб, середина холста остаётся на месте. */
  function resetZoom(): void {
    zoomTo(DM_SCREEN_ZOOM.max);
  }

  /**
   * Ставит точку поля в середину холста.
   * @param center - точка поля
   */
  function centerOn(center: DmScreenPoint): void {
    view.value = centerDmScreenView(view.value, center, canvas.value);
  }

  /**
   * Показывает все переданные прямоугольники разом: поле отдаляется, пока
   * они не поместятся. Без них обзор возвращается к началу поля.
   * @param rects - что должно быть видно
   */
  function fit(rects: ReadonlyArray<DmScreenRect>): void {
    const bounds = getDmScreenBounds(rects);

    view.value = bounds
      ? fitDmScreenView(bounds, canvas.value, DM_SCREEN_FIT_PADDING)
      : DM_SCREEN_VIEW_DEFAULT;
  }

  /**
   * Подводит обзор к прямоугольнику, если его совсем не видно.
   * @param rect - прямоугольник на поле
   */
  function reveal(rect: DmScreenRect): void {
    if (!isDmScreenRectVisible(rect, board.value)) {
      centerOn(getDmScreenRectCenter(rect));
    }
  }

  return {
    // Наружу только чтение: обзор меняют действия
    view: computed<DmScreenView>(() => view.value),
    board,
    canvas,
    setCanvas,
    toCanvasPoint,
    toBoardPoint,
    toCanvasRect,
    pan,
    zoomTo,
    zoomIn,
    zoomOut,
    resetZoom,
    centerOn,
    fit,
    reveal,
  };
});
