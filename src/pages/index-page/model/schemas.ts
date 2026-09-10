import type { TPartner } from '@/shared/stores/NavStore';
import { z } from '@/shared/utils/zod';

import type { TYoutubeVideo } from '@/features/youtube/types/Youtube';

/**
 * Схема партнёра из `GET /partners`. Описание и порядок необязательны: без
 * описания у чипа просто нет подсказки, без порядка партнёр встаёт в начало.
 */
const partnerSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullish(),
  img: z.string(),
  url: z.string().min(1),
  order: z.number().nullish(),
});

/**
 * Схема ролика из `GET /youtube`. На главной нужны только `id` и `name`,
 * остальные поля могут отсутствовать — это не повод прятать ролик.
 */
const videoSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  active: z.boolean().nullish(),
  created: z.string().nullish(),
  order: z.number().nullish(),
});

/**
 * Разбирает массив из ответа API, отсеивая битые записи поштучно и сообщая о
 * каждой в консоль. Поэлементно — чтобы одна кривая запись не прятала весь
 * блок главной.
 * @param input - сырой массив из ответа API
 * @param schema - схема одной записи
 * @param label - подпись записи для сообщения в консоли
 * @returns записи, прошедшие разбор
 */
function parseList<T>(
  input: unknown,
  schema: z.ZodType<T>,
  label: string,
): Array<T> {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.flatMap((entry) => {
    const parsed = schema.safeParse(entry);

    if (!parsed.success) {
      console.warn(`[home] ${label} не прошёл разбор:`, entry);

      return [];
    }

    return [parsed.data];
  });
}

/**
 * Валидирует список партнёров для блока «Наши друзья» и приводит записи к
 * модели `TPartner`.
 * @param input - сырой ответ `GET /partners`
 */
export function parseHomePartners(input: unknown): Array<TPartner> {
  return parseList(input, partnerSchema, 'Партнёр').map((partner) => ({
    name: partner.name,
    description: partner.description ?? undefined,
    img: partner.img,
    url: partner.url,
    order: partner.order ?? 0,
  }));
}

/**
 * Валидирует ролики для панели видео и приводит записи к модели
 * `TYoutubeVideo`: плееру нужна полная модель, поэтому неиспользуемые на
 * главной поля получают нейтральные значения.
 * @param input - сырой список роликов из ответа `GET /youtube`
 */
export function parseHomeVideos(input: unknown): Array<TYoutubeVideo> {
  return parseList(input, videoSchema, 'Ролик').map((video) => ({
    id: video.id,
    name: video.name,
    active: video.active ?? true,
    created: video.created ?? '',
    order: video.order ?? 0,
  }));
}
