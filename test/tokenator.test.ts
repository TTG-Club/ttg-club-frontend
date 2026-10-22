import { describe, expect, it } from 'vitest';

import {
  BYTES_IN_MB,
  clampTokenScale,
  getCenteredOffset,
  getPointsDistance,
  getTokenImageError,
  rescaleTokenOffset,
  TOKENATOR_TEXT,
} from '~tools/tokenator/model';

describe('getTokenImageError', () => {
  const image = { type: 'image/png', size: 1024, width: 800, height: 600 };

  it('пропускает подходящую картинку', () => {
    expect(getTokenImageError(image)).toBeUndefined();
  });

  it('не берёт не картинки, тяжёлые и огромные файлы', () => {
    expect(getTokenImageError({ ...image, type: 'application/pdf' })).toBe(
      TOKENATOR_TEXT.notImage,
    );

    expect(getTokenImageError({ ...image, size: 50 * BYTES_IN_MB })).toBe(
      TOKENATOR_TEXT.tooLarge,
    );

    expect(getTokenImageError({ ...image, width: 9000 })).toBe(
      TOKENATOR_TEXT.tooBig,
    );
  });
});

describe('масштаб и положение', () => {
  it('держит масштаб в пределах', () => {
    expect(clampTokenScale(0)).toBe(0.1);
    expect(clampTokenScale(5)).toBe(2);
    expect(clampTokenScale(1.5)).toBe(1.5);
  });

  it('ставит картинку по центру', () => {
    expect(getCenteredOffset(1)).toEqual({ x: 0, y: 0 });
    expect(getCenteredOffset(0.5)).toEqual({ x: 128, y: 128 });
  });

  it('при смене масштаба сохраняет центр', () => {
    expect(rescaleTokenOffset({ x: 128, y: 128 }, 0.5, 1)).toEqual({
      x: 0,
      y: 0,
    });
  });

  it('считает расстояние между касаниями', () => {
    expect(getPointsDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});
