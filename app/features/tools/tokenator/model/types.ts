import type { TOKEN_FORMATS } from './constants';

export type TokenFormat = (typeof TOKEN_FORMATS)[number]['value'];

/** Левый верхний угол картинки в единицах SVG токена. */
export interface TokenOffset {
  x: number;
  y: number;
}

/** Что известно о загруженной картинке до её проверки. */
export interface TokenImageInfo {
  type: string;
  /** Вес, байт. */
  size: number;
  width: number;
  height: number;
}
