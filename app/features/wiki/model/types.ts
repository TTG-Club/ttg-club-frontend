import type { ScreenLink } from './schema';

/** Группа вложенных разделов ширмы; без названия — разделы вне групп. */
export interface ScreenGroup {
  key: string;
  name?: string;
  items: Array<ScreenLink>;
}

/** Узел очищенной SVG-иконки. */
export interface SvgNode {
  tag: string;
  attributes: Record<string, string>;
  children: Array<SvgNode>;
}

/** Точка на экране, px. */
export interface ScreenWindowPoint {
  x: number;
  y: number;
}

/** Размер окна или экрана, px. */
export interface ScreenWindowSize {
  width: number;
  height: number;
}

/** Просьба открыть раздел ширмы в окне. */
export interface ScreenWindowRequest {
  path: string;
  /** Название в шапке окна и на плашке свёрнутого окна. */
  title: string;
  /** SVG-разметка иконки раздела для шапки и плашки окна. */
  icon?: string | null;
  /** Точка клика: окно встаёт рядом с ней, а не в центре экрана. */
  origin?: ScreenWindowPoint;
}
