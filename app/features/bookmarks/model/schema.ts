import type { BookmarkCategoryInfo, BookmarkEntry } from './types';

import { z } from 'zod';

/** Проверка записи закладок из API или из хранилища браузера. */
export const bookmarkEntrySchema: z.ZodType<BookmarkEntry> = z
  .object({
    uuid: z.string(),
    name: z.string(),
    order: z.number().nullish(),
    parentUUID: z.string().nullish(),
    url: z.string().nullish(),
  })
  .transform((entry) => ({
    uuid: entry.uuid,
    name: entry.name,
    order: entry.order ?? 0,
    parentUUID: entry.parentUUID ?? undefined,
    url: entry.url ?? undefined,
  }));

export const bookmarkListSchema = z.array(bookmarkEntrySchema);

/** Проверка категории закладки по адресу. */
export const bookmarkCategorySchema: z.ZodType<BookmarkCategoryInfo> = z
  .object({
    name: z.string(),
    code: z.string(),
    order: z.number().nullish(),
  })
  .transform((category) => ({
    name: category.name,
    code: category.code,
    order: category.order ?? 0,
  }));
