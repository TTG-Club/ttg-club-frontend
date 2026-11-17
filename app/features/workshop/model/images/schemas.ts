import type { WorkshopCover } from './types';

import { z } from 'zod';

const gallerySchema = z.object({
  images: z.array(z.string()),
});

const tokenSchema = z.object({
  url: z.string().nullable(),
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

/**
 * Адрес токена существа из ответа бэкенда.
 * @param raw - ответ ручки токена
 * @returns адрес или `undefined`, если токена нет
 */
export function parseWorkshopToken(raw: unknown): string | undefined {
  return tokenSchema.parse(raw).url ?? undefined;
}
