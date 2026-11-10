import { describe, expect, it } from 'vitest';

import {
  moveGalleryImage,
  parseWorkshopCover,
  parseWorkshopGallery,
  removeGalleryImage,
} from '~workshop/model';

const IMAGES = ['first.webp', 'second.webp', 'third.webp'];

describe('workshop images', () => {
  it('moves an image to a neighbour place', () => {
    expect(moveGalleryImage(IMAGES, 1, -1)).toEqual([
      'second.webp',
      'first.webp',
      'third.webp',
    ]);

    expect(moveGalleryImage(IMAGES, 1, 1)).toEqual([
      'first.webp',
      'third.webp',
      'second.webp',
    ]);
  });

  it('keeps the gallery when there is nowhere to move', () => {
    expect(moveGalleryImage(IMAGES, 0, -1)).toEqual(IMAGES);
    expect(moveGalleryImage(IMAGES, 2, 1)).toEqual(IMAGES);
  });

  it('removes an image by index', () => {
    expect(removeGalleryImage(IMAGES, 0)).toEqual([
      'second.webp',
      'third.webp',
    ]);
  });

  it('parses backend responses', () => {
    expect(parseWorkshopGallery({ images: IMAGES })).toEqual(IMAGES);

    expect(
      parseWorkshopCover({
        url: 'https://img.ttg.club/a.webp',
        editable: false,
      }),
    ).toEqual({ url: 'https://img.ttg.club/a.webp', editable: false });

    expect(() => parseWorkshopGallery({ images: 'first.webp' })).toThrow();
  });
});
