import { z } from 'zod';

import { entrySourceSchema } from '~section/model';

/** Найденная запись: название, раздел, адрес и источник. */
export const searchResultSchema = z.object({
  name: z.string(),
  englishName: z.string().nullish(),
  section: z.string(),
  url: z.string(),
  description: z.string().nullish(),
  source: entrySourceSchema.nullish(),
});

/** Страница результатов и общее число найденного. */
export const searchResponseSchema = z.object({
  items: z.array(searchResultSchema),
  total: z.number(),
});

export type SearchResult = z.infer<typeof searchResultSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;
