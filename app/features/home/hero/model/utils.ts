import type { CSSProperties } from 'vue';

import type { HomeMapPlacement, HomeMapPoint, HomeMapSize } from './types';

import { HOME_HERO_MAP_VIEWBOX } from './constants';

/**
 * Длина в единицах карты. Фигуры карты шапки стоят на сцене, где единица карты
 * — ровно пиксель, а под ширину холста масштабируется сцена целиком.
 *
 * @param units - единицы карты
 * @returns длина в пикселях сцены
 */
function toMapPixels(units: number): string {
  return `${Number(units.toFixed(3))}px`;
}

/**
 * Прямоугольник на сцене карты шапки.
 *
 * @param point - левый верхний угол, единицы карты
 * @param size - размер, единицы карты
 * @returns положение и размер слоя
 */
export function getHomeMapBoxStyle(
  point: HomeMapPoint,
  size: HomeMapSize,
): CSSProperties {
  return {
    left: toMapPixels(point.x - HOME_HERO_MAP_VIEWBOX.x),
    top: toMapPixels(point.y - HOME_HERO_MAP_VIEWBOX.y),
    width: toMapPixels(size.width),
    height: toMapPixels(size.height),
  };
}

/**
 * Сдвиг и поворот фигуры, которая стоит на карте в точке `placement`, — для
 * слоя фигуры в левом верхнем углу сцены. Сдвиг в пикселях, а не в процентах
 * от фигуры: анимацию `transform`, зависящую от размера элемента, браузер не
 * отдаёт композитору и ведёт в основном потоке.
 *
 * @param placement - точка привязки (центр фигуры) и поворот
 * @param size - размер слоя фигуры, единицы карты
 * @returns значения `translate` и `rotate`
 */
export function getHomeMapFigureTransform(
  placement: HomeMapPlacement,
  size: HomeMapSize,
): { translate: string; rotate: string } {
  const left = placement.x - HOME_HERO_MAP_VIEWBOX.x - size.width / 2;
  const top = placement.y - HOME_HERO_MAP_VIEWBOX.y - size.height / 2;

  return {
    translate: `${toMapPixels(left)} ${toMapPixels(top)}`,
    rotate: `${Number(placement.angle.toFixed(3))}deg`,
  };
}

/**
 * Слой фигуры в левом верхнем углу сцены, сдвинутый на стоянку.
 *
 * @param size - размер фигуры
 * @param parking - где она стоит без анимации
 * @returns положение, размер и сдвиг слоя
 */
export function getHomeMapFigureStyle(
  size: HomeMapSize,
  parking: HomeMapPlacement,
): CSSProperties {
  return {
    ...getHomeMapBoxStyle(HOME_HERO_MAP_VIEWBOX, size),
    ...getHomeMapFigureTransform(parking, size),
  };
}

/**
 * Слой клубов над трубой: устье трубы — в центре слоя.
 *
 * @param chimney - устье трубы
 * @param puffSize - размер клуба дыма
 * @returns положение и размер слоя
 */
export function getHomeMapChimneyStyle(
  chimney: HomeMapPoint,
  puffSize: HomeMapSize,
): CSSProperties {
  return getHomeMapBoxStyle(
    {
      x: chimney.x - puffSize.width / 2,
      y: chimney.y - puffSize.height / 2,
    },
    puffSize,
  );
}

/**
 * Атрибут `viewBox` прямоугольника в единицах карты.
 *
 * @param box - левый верхний угол и размер
 * @returns строка `viewBox`
 */
export function getHomeMapViewBox(box: HomeMapPoint & HomeMapSize): string {
  return [box.x, box.y, box.width, box.height].join(' ');
}

/**
 * `viewBox` слоя фигуры: начало координат рисунка — в центре слоя.
 *
 * @param size - размер фигуры
 * @returns строка `viewBox`
 */
export function getHomeMapFigureViewBox(size: HomeMapSize): string {
  return getHomeMapViewBox({
    x: -size.width / 2,
    y: -size.height / 2,
    ...size,
  });
}
