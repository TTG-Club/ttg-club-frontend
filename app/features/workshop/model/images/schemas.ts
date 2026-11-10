import type { WorkshopCover } from './types';

import { z } from 'zod';

const gallerySchema = z.object({
  images: z.array(z.string()),
});

const coverSchema = z.object({
  url: z.string(),
  editable: z.boolean(),
});

/**
 * Галерея записи из ответа бэкенда.
 * @param raw - ответ ручки галереи
 */
export function parseWorkshopGallery(raw: unknown): Array<string> {
  return gallerySchema.parse(raw).images;
}

/**
 * Обложка из ответа бэкенда.
 * @param raw - ответ ручки обложки
 */
export function parseWorkshopCover(raw: unknown): WorkshopCover {
  return coverSchema.parse(raw);
}
