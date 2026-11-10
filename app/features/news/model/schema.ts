import type { RenderNode } from '../markup';
import type { NewsDetailed, NewsShort } from './types';

import { z } from 'zod';

/**
 * Узел разметки: строка (в т.ч. сырая JSON-строка), массив или объект —
 * бэкенд присылает все три вида, разбирает их `toNewsMarkup`.
 *
 * @param value - Значение поля из ответа API
 * @returns Похоже ли значение на разметку
 */
function checkRenderNode(value: unknown): value is RenderNode {
  return (
    typeof value === 'string'
    || Array.isArray(value)
    || (typeof value === 'object' && value !== null)
  );
}

const renderNodeSchema = z.custom<RenderNode>(
  checkRenderNode,
  'Ожидается разметка',
);

/** Необязательная строка; пустая строка тоже считается отсутствием. */
const optionalTextSchema = z
  .string()
  .nullish()
  .transform((value) => value || null);

/** Необязательная разметка; без неё — пустой текст. */
const optionalMarkupSchema = renderNodeSchema
  .nullish()
  .transform((value) => value ?? '');

/**
 * Общие поля новостей сайта и сообщества. Поля, которых у одного из видов
 * нет, необязательны и приводятся к `null`.
 */
const newsShortShape = {
  id: z.string(),
  url: z.string().min(1),
  title: z.string(),
  typeName: optionalTextSchema,
  authorName: optionalTextSchema,
  previewImageUrl: optionalTextSchema,
  videoUrl: optionalTextSchema,
  publishDateTime: optionalTextSchema,
  preview: optionalMarkupSchema,
};

const newsShortSchema: z.ZodType<NewsShort, unknown> = z.object(newsShortShape);

const newsDetailedSchema: z.ZodType<NewsDetailed, unknown> = z.object({
  ...newsShortShape,
  sourceUrl: optionalTextSchema,
  content: optionalMarkupSchema,
});

/**
 * Проверяет список свежих новостей (`GET /search`). Битая запись не прячет
 * остальные — она просто выпадает из списка.
 *
 * @param payload - Ответ API
 * @returns Новости в порядке ответа
 */
export function parseNewsList(payload: unknown): Array<NewsShort> {
  return z
    .array(z.unknown())
    .parse(payload)
    .flatMap((item) => {
      const result = newsShortSchema.safeParse(item);

      return result.success ? [result.data] : [];
    });
}

/**
 * Проверяет полную новость (`GET /{url}`).
 *
 * @param payload - Ответ API
 * @returns Новость для чтения
 */
export function parseNewsDetailed(payload: unknown): NewsDetailed {
  return newsDetailedSchema.parse(payload);
}
