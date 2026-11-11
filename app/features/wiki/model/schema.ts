import { z } from 'zod';

import { entryNameSchema, entrySourceSchema } from '~section/model';

/** Бог в списке раздела. */
export const godLinkSchema = z.object({
  name: entryNameSchema,
  url: z.string().min(1),
  alignment: z.string(),
  shortAlignment: z.string(),
});

export type GodLink = z.infer<typeof godLinkSchema>;

/** Карточка бога. Свойства из других источников заполнены не у всех. */
export const godDetailSchema = godLinkSchema.omit({ url: true }).extend({
  description: z.string().nullish(),
  rank: z.string().nullish(),
  titles: z.array(z.string()).nullish(),
  symbol: z.string().nullish(),
  domains: z.array(z.string()).nullish(),
  panteons: z.array(z.string()).nullish(),
  images: z.array(z.string()).nullish(),
  source: entrySourceSchema.nullish(),
});

export type GodDetail = z.infer<typeof godDetailSchema>;

/** Правило или термин в списке раздела. */
export const ruleLinkSchema = z.object({
  name: entryNameSchema,
  url: z.string().min(1),
});

export type RuleLink = z.infer<typeof ruleLinkSchema>;

export const ruleDetailSchema = z.object({
  name: entryNameSchema,
  description: z.string().nullish(),
  type: z.string().nullish(),
  source: entrySourceSchema.nullish(),
});

export type RuleDetail = z.infer<typeof ruleDetailSchema>;

/** Тип книги: официальная, тестовая, сторонняя и так далее. */
const bookTypeSchema = z.object({
  name: z.string(),
  order: z.number(),
});

/** Источник (книга) в списке раздела. */
export const bookLinkSchema = z.object({
  name: entryNameSchema,
  url: z.string().min(1),
  type: bookTypeSchema,
});

export type BookLink = z.infer<typeof bookLinkSchema>;

export const bookDetailSchema = z.object({
  name: entryNameSchema,
  type: bookTypeSchema,
  description: z.string().nullish(),
  source: entrySourceSchema.nullish(),
});

export type BookDetail = z.infer<typeof bookDetailSchema>;

/** Раздел ширмы в списке или в группе родительского раздела. */
export const screenLinkSchema = z.object({
  name: entryNameSchema,
  url: z.string().min(1),
  order: z.number().nullish(),
  source: entrySourceSchema.nullish(),
  /** SVG-разметка иконки из базы. */
  icon: z.string().nullish(),
  /** Группа внутри родительского раздела. */
  group: z.string().nullish(),
});

export type ScreenLink = z.infer<typeof screenLinkSchema>;

/**
 * Раздел ширмы: у корневого раздела вложенные разделы, у вложенного —
 * ссылка на родителя.
 */
export const screenDetailSchema = screenLinkSchema.extend({
  description: z.string().nullish(),
  parent: z
    .object({
      name: entryNameSchema,
      url: z.string().min(1),
    })
    .nullish(),
  chields: z.array(screenLinkSchema).nullish(),
});

export type ScreenDetail = z.infer<typeof screenDetailSchema>;

/**
 * Окно ширмы поверх сайта, сохранённое в браузере: раздел, место, размер,
 * слой и свёрнутость.
 */
export const screenWindowSchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
  title: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  /** Чем больше, тем выше окно среди остальных. */
  layer: z.number().int(),
  isMinimized: z.boolean(),
});

export type ScreenWindowState = z.infer<typeof screenWindowSchema>;

export const screenWindowListSchema = z.array(screenWindowSchema);
