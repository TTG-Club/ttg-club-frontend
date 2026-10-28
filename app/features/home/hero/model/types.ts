/**
 * Повозка и дым на карте шапки:
 * - `static` — анимации нет вовсе (телефон, «меньше движения» или посетитель
 *   выключил её ещё до захода на страницу): повозка стоит, дыма нет;
 * - `running` — едет и дымит;
 * - `paused` — замерла на месте: выключена кнопкой или шапка за экраном.
 */
export type HomeHeroMotionState = 'static' | 'running' | 'paused';

/** Точка на карте деревни в шапке, в единицах карты */
export interface HomeMapPoint {
  x: number;
  y: number;
}

/** Размер фигуры на карте, в единицах карты */
export interface HomeMapSize {
  width: number;
  height: number;
}

/** Где стоит фигура на карте: точка привязки (центр фигуры) и поворот */
export type HomeMapPlacement = HomeMapPoint & {
  /** Поворот по часовой стрелке, градусы */
  angle: number;
};
