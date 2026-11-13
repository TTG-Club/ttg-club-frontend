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

/** Корневой раздел, к которому относится вложенный. */
const screenParentSchema = z.object({
  name: entryNameSchema,
  url: z.string().min(1),
  /** Порядок корневого раздела: по нему идут группы справочника. */
  order: z.number().nullish(),
});

/**
 * Раздел справочника в списке или в группе корневого раздела. Корневой
 * раздел есть у вложенных разделов в списке справочника.
 */
export const screenLinkSchema = z.object({
  name: entryNameSchema,
  url: z.string().min(1),
  order: z.number().nullish(),
  source: entrySourceSchema.nullish(),
  /** SVG-разметка иконки из базы. */
  icon: z.string().nullish(),
  /** Группа внутри родительского раздела. */
  group: z.string().nullish(),
  parent: screenParentSchema.nullish(),
});

export type ScreenLink = z.infer<typeof screenLinkSchema>;

/**
 * Раздел справочника: у корневого раздела вложенные разделы, у вложенного —
 * ссылка на родителя.
 */
export const screenDetailSchema = screenLinkSchema.extend({
  description: z.string().nullish(),
  chields: z.array(screenLinkSchema).nullish(),
});

export type ScreenDetail = z.infer<typeof screenDetailSchema>;
