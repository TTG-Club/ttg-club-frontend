import type { YoutubeVideo, YoutubeVideoPage } from './types';

import { z } from 'zod';

import {
  YOUTUBE_ID_LENGTH,
  YOUTUBE_NAME_MAX_LENGTH,
  YOUTUBE_VALIDATION,
} from './constants';
import { extractYoutubeId } from './utils';

/** Ролик из ответа бэкенда; без `id` он бесполезен. */
const youtubeVideoSchema = z.object({
  id: z.string().min(1),
  name: z.string().catch(''),
  active: z.boolean().catch(false),
  created: z.string().nullish().catch(null),
  order: z.number().catch(0),
});

const youtubeVideoPageSchema = z.object({
  items: z.array(z.unknown()).catch([]),
  total: z.coerce.number().catch(0),
});

/**
 * Ролик из ответа бэкенда.
 * @param input - ответ сервера
 */
export function parseYoutubeVideo(input: unknown): YoutubeVideo {
  const parsed = youtubeVideoSchema.parse(input);

  return { ...parsed, created: parsed.created ?? '' };
}

/**
 * Страница роликов. Битые записи отбрасываются поштучно, чтобы одна запись
 * не прятала весь список.
 * @param input - ответ сервера
 */
export function parseYoutubeVideoPage(input: unknown): YoutubeVideoPage {
  const parsed = youtubeVideoPageSchema.parse(input);

  return {
    items: parsed.items.flatMap((item) => {
      const video = youtubeVideoSchema.safeParse(item);

      return video.success
        ? [{ ...video.data, created: video.data.created ?? '' }]
        : [];
    }),
    total: parsed.total,
  };
}

/**
 * Число роликов на главной.
 * @param input - ответ сервера
 */
export function parseYoutubeCount(input: unknown): number {
  return z.coerce.number().catch(0).parse(input);
}

/** Название ролика: обязательное, с лимитом бэкенда. */
const youtubeNameSchema = z
  .string()
  .trim()
  .min(1, YOUTUBE_VALIDATION.nameRequired)
  .max(YOUTUBE_NAME_MAX_LENGTH, YOUTUBE_VALIDATION.nameTooLong);

/** Форма нового ролика: ссылка превращается в ID. */
export const youtubeCreateSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, YOUTUBE_VALIDATION.idRequired)
    .transform((value, context) => {
      const videoId = extractYoutubeId(value);

      if (videoId?.length !== YOUTUBE_ID_LENGTH) {
        context.addIssue({
          code: 'custom',
          message: YOUTUBE_VALIDATION.idInvalid,
        });

        return z.NEVER;
      }

      return videoId;
    }),
  name: youtubeNameSchema,
});

/** Форма правки ролика: меняется только название. */
export const youtubeEditSchema = z.object({ name: youtubeNameSchema });

export type YoutubeCreateInput = z.input<typeof youtubeCreateSchema>;
export type YoutubeCreateData = z.output<typeof youtubeCreateSchema>;
export type YoutubeEditInput = z.input<typeof youtubeEditSchema>;
