import type { TokenImageInfo, TokenOffset } from './types';

import { clamp } from 'es-toolkit';

import {
  BYTES_IN_MB,
  TOKEN_LIMIT,
  TOKEN_SCALE,
  TOKEN_SIZE,
  TOKENATOR_TEXT,
} from './constants';

/**
 * Проверяет картинку перед загрузкой в токен.
 * @param image - тип, вес и размеры картинки
 * @returns текст ошибки или `undefined`, если картинка подходит
 */
export function getTokenImageError(image: TokenImageInfo): string | undefined {
  if (!image.type.startsWith('image/')) {
    return TOKENATOR_TEXT.notImage;
  }

  if (image.size / BYTES_IN_MB >= TOKEN_LIMIT.sizeMb) {
    return TOKENATOR_TEXT.tooLarge;
  }

  if (
    image.width > TOKEN_LIMIT.dimension
    || image.height > TOKEN_LIMIT.dimension
  ) {
    return TOKENATOR_TEXT.tooBig;
  }

  return undefined;
}

/**
 * Масштаб в допустимых пределах.
 * @param scale - желаемый масштаб
 */
export function clampTokenScale(scale: number): number {
  return clamp(scale, TOKEN_SCALE.min, TOKEN_SCALE.max);
}

/**
 * Положение картинки по центру токена.
 * @param scale - масштаб картинки
 */
export function getCenteredOffset(scale: number): TokenOffset {
  const shift = (TOKEN_SIZE - TOKEN_SIZE * scale) / 2;

  return { x: shift, y: shift };
}

/**
 * Сдвигает картинку при смене масштаба так, чтобы её центр остался на месте.
 * @param offset - текущее положение
 * @param fromScale - прежний масштаб
 * @param toScale - новый масштаб
 */
export function rescaleTokenOffset(
  offset: TokenOffset,
  fromScale: number,
  toScale: number,
): TokenOffset {
  const shift = (TOKEN_SIZE * (toScale - fromScale)) / 2;

  return { x: offset.x - shift, y: offset.y - shift };
}

/**
 * Расстояние между двумя касаниями, для масштаба щипком.
 * @param first - первая точка
 * @param second - вторая точка
 */
export function getPointsDistance(
  first: TokenOffset,
  second: TokenOffset,
): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}
