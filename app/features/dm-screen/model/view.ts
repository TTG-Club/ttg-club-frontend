import type { DmScreenView } from './schema';
import type {
  DmScreenGrid,
  DmScreenPoint,
  DmScreenRect,
  DmScreenSize,
} from './types';

import { clamp, range } from 'es-toolkit';

import {
  DM_SCREEN_BACKDROP,
  DM_SCREEN_FIELD,
  DM_SCREEN_MINIMAP_MIN_ZOOM,
  DM_SCREEN_MINIMAP_PADDING,
  DM_SCREEN_MINIMAP_SIZE,
  DM_SCREEN_ZOOM,
} from './constants';

/**
 * Масштаб в допустимых пределах: ближе, чем один к одному, поле не подходит.
 * @param zoom - желаемый масштаб
 * @param minZoom - наименьший масштаб
 */
export function clampDmScreenZoom(
  zoom: number,
  minZoom: number = DM_SCREEN_ZOOM.min,
): number {
  return clamp(zoom, minZoom, DM_SCREEN_ZOOM.max);
}

/**
 * Видимая часть поля: что помещается на холст при этом обзоре. Края
 * округлены: окна, которые к ним притягиваются, стоят на целых пикселях.
 * @param view - обзор
 * @param canvas - размер холста на экране
 */
export function getDmScreenVisibleRect(
  view: DmScreenView,
  canvas: DmScreenSize,
): DmScreenRect {
  return {
    x: Math.round(view.x),
    y: Math.round(view.y),
    width: Math.round(canvas.width / view.zoom),
    height: Math.round(canvas.height / view.zoom),
  };
}

/**
 * Точка поля по точке холста.
 * @param point - точка на холсте, px от его левого верхнего угла
 * @param view - обзор
 */
export function toDmScreenFieldPoint(
  point: DmScreenPoint,
  view: DmScreenView,
): DmScreenPoint {
  return {
    x: view.x + point.x / view.zoom,
    y: view.y + point.y / view.zoom,
  };
}

/**
 * Прямоугольник поля, как он виден на холсте.
 * @param rect - прямоугольник на поле
 * @param view - обзор
 */
export function toDmScreenCanvasRect(
  rect: DmScreenRect,
  view: DmScreenView,
): DmScreenRect {
  return {
    x: (rect.x - view.x) * view.zoom,
    y: (rect.y - view.y) * view.zoom,
    width: rect.width * view.zoom,
    height: rect.height * view.zoom,
  };
}

/**
 * Обзор, не выходящий за края поля. Если холст вмещает больше, чем всё
 * поле, оно встаёт по центру.
 * @param view - желаемый обзор
 * @param canvas - размер холста на экране
 */
export function clampDmScreenView(
  view: DmScreenView,
  canvas: DmScreenSize,
): DmScreenView {
  const width = canvas.width / view.zoom;
  const height = canvas.height / view.zoom;

  return {
    ...view,
    x:
      width >= DM_SCREEN_FIELD.width
        ? DM_SCREEN_FIELD.x - (width - DM_SCREEN_FIELD.width) / 2
        : clamp(
            view.x,
            DM_SCREEN_FIELD.x,
            DM_SCREEN_FIELD.x + DM_SCREEN_FIELD.width - width,
          ),
    y:
      height >= DM_SCREEN_FIELD.height
        ? DM_SCREEN_FIELD.y - (height - DM_SCREEN_FIELD.height) / 2
        : clamp(
            view.y,
            DM_SCREEN_FIELD.y,
            DM_SCREEN_FIELD.y + DM_SCREEN_FIELD.height - height,
          ),
  };
}

/**
 * Окно, целиком стоящее на поле: за край поля оно не выходит, а больше
 * поля не становится.
 * @param rect - желаемые место и размер окна
 */
export function keepDmScreenWindowOnField(rect: DmScreenRect): DmScreenRect {
  const width = Math.min(rect.width, DM_SCREEN_FIELD.width);
  const height = Math.min(rect.height, DM_SCREEN_FIELD.height);

  return {
    x: clamp(
      rect.x,
      DM_SCREEN_FIELD.x,
      DM_SCREEN_FIELD.x + DM_SCREEN_FIELD.width - width,
    ),
    y: clamp(
      rect.y,
      DM_SCREEN_FIELD.y,
      DM_SCREEN_FIELD.y + DM_SCREEN_FIELD.height - height,
    ),
    width,
    height,
  };
}

/**
 * Где на холсте стоит начало координат поля, в целых пикселях: дробный
 * сдвиг размывал бы текст окон.
 * @param view - обзор
 */
export function getDmScreenFieldOffset(view: DmScreenView): DmScreenPoint {
  return {
    x: Math.round(-view.x * view.zoom),
    y: Math.round(-view.y * view.zoom),
  };
}

/**
 * Масштаб поля в процентах для подписи: `0.5` — «50%».
 * @param zoom - масштаб поля
 */
export function formatDmScreenZoom(zoom: number): string {
  return `${Math.round(zoom * 100)}%`;
}

/**
 * Сдвигает обзор вслед за указателем: поле едет вместе с ним.
 * @param view - обзор в начале жеста
 * @param delta - на сколько сдвинулся указатель на экране
 */
export function panDmScreenView(
  view: DmScreenView,
  delta: DmScreenPoint,
): DmScreenView {
  return {
    ...view,
    x: view.x - delta.x / view.zoom,
    y: view.y - delta.y / view.zoom,
  };
}

/**
 * Меняет масштаб так, что точка поля под якорем остаётся на месте.
 * @param view - обзор
 * @param zoom - желаемый масштаб
 * @param anchor - точка холста, вокруг которой меняется масштаб
 */
export function zoomDmScreenView(
  view: DmScreenView,
  zoom: number,
  anchor: DmScreenPoint,
): DmScreenView {
  const nextZoom = clampDmScreenZoom(zoom);
  const fieldAnchor = toDmScreenFieldPoint(anchor, view);

  return {
    x: fieldAnchor.x - anchor.x / nextZoom,
    y: fieldAnchor.y - anchor.y / nextZoom,
    zoom: nextZoom,
  };
}

/**
 * Ставит точку поля в середину холста, масштаб не меняется.
 * @param view - обзор
 * @param center - точка поля
 * @param canvas - размер холста на экране
 */
export function centerDmScreenView(
  view: DmScreenView,
  center: DmScreenPoint,
  canvas: DmScreenSize,
): DmScreenView {
  return {
    ...view,
    x: center.x - canvas.width / view.zoom / 2,
    y: center.y - canvas.height / view.zoom / 2,
  };
}

/**
 * Середина прямоугольника.
 * @param rect - прямоугольник
 */
export function getDmScreenRectCenter(rect: DmScreenRect): DmScreenPoint {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

/**
 * Наименьший прямоугольник, в который помещаются все переданные; без
 * прямоугольников его нет.
 * @param rects - прямоугольники на поле
 */
export function getDmScreenBounds(
  rects: ReadonlyArray<DmScreenRect>,
): DmScreenRect | undefined {
  if (!rects.length) {
    return undefined;
  }

  const left = Math.min(...rects.map((rect) => rect.x));
  const top = Math.min(...rects.map((rect) => rect.y));
  const right = Math.max(...rects.map((rect) => rect.x + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.height));

  return { x: left, y: top, width: right - left, height: bottom - top };
}

/**
 * Обзор, при котором прямоугольник поля целиком виден и стоит по центру:
 * поле отдаляется настолько, насколько нужно, но не приближается сверх
 * обычного.
 * @param bounds - что должно поместиться
 * @param canvas - размер холста на экране
 * @param padding - отступ от краёв холста, px
 * @param minZoom - наименьший масштаб; то, что не влезло, останется за краем
 */
export function fitDmScreenView(
  bounds: DmScreenRect,
  canvas: DmScreenSize,
  padding: number,
  minZoom: number = DM_SCREEN_ZOOM.min,
): DmScreenView {
  const zoom = clampDmScreenZoom(
    Math.min(
      (canvas.width - padding * 2) / bounds.width,
      (canvas.height - padding * 2) / bounds.height,
    ),
    minZoom,
  );

  return centerDmScreenView(
    { x: 0, y: 0, zoom },
    getDmScreenRectCenter(bounds),
    canvas,
  );
}

/**
 * Как поле ложится на миникарту: целиком и по центру. Этим обзором точки
 * миникарты переводятся в точки поля и обратно.
 */
export const DM_SCREEN_MINIMAP_VIEW: DmScreenView = fitDmScreenView(
  DM_SCREEN_FIELD,
  DM_SCREEN_MINIMAP_SIZE,
  DM_SCREEN_MINIMAP_PADDING,
  DM_SCREEN_MINIMAP_MIN_ZOOM,
);

/**
 * Виден ли прямоугольник хотя бы частью.
 * @param rect - прямоугольник на поле
 * @param board - видимая часть поля
 */
export function isDmScreenRectVisible(
  rect: DmScreenRect,
  board: DmScreenRect,
): boolean {
  return (
    rect.x < board.x + board.width
    && board.x < rect.x + rect.width
    && rect.y < board.y + board.height
    && board.y < rect.y + rect.height
  );
}

/**
 * Шаг точек на пустом месте поля, px на экране. Когда поле отдалено и точки
 * сливаются, шаг удваивается, пока не станет различимым.
 * @param zoom - масштаб поля
 */
export function getDmScreenBackdropStep(zoom: number): number {
  const step = DM_SCREEN_BACKDROP.step * zoom;

  const doublings = Math.max(
    0,
    Math.ceil(Math.log2(DM_SCREEN_BACKDROP.minStep / step)),
  );

  return step * 2 ** doublings;
}

/**
 * Размер для привязки `style`.
 * @param size - размер, px
 */
export function getDmScreenSizeStyle(
  size: DmScreenSize,
): Record<'width' | 'height', string> {
  return { width: `${size.width}px`, height: `${size.height}px` };
}

/**
 * Клетки поля выбора сетки по рядам: слева направо, сверху вниз.
 * @param size - сколько клеток по стороне
 */
export function getDmScreenGridCells(size: number): Array<DmScreenGrid> {
  return range(size * size).map((index) => ({
    columns: (index % size) + 1,
    rows: Math.floor(index / size) + 1,
  }));
}

/**
 * Попадает ли клетка поля выбора в сетку: сетка тянется от левого верхнего
 * угла до клетки под указателем.
 * @param cell - клетка: её колонка и ряд
 * @param grid - выбранная сетка
 */
export function isDmScreenGridCellInside(
  cell: DmScreenGrid,
  grid: DmScreenGrid,
): boolean {
  return cell.columns <= grid.columns && cell.rows <= grid.rows;
}

/**
 * Сетка подписью: «3 × 2» — три колонки, два ряда.
 * @param grid - сетка
 */
export function formatDmScreenGrid(grid: DmScreenGrid): string {
  return `${grid.columns} × ${grid.rows}`;
}
