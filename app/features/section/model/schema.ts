import { z } from 'zod';

const filterValueSchema = z.object({
  label: z.string(),
  key: z.union([z.string(), z.number()]),
  default: z.boolean().nullish(),
  tooltip: z.string().nullish(),
});

const filterGroupSchema = z.object({
  name: z.string().nullish(),
  key: z.string(),
  hidden: z.boolean().nullish(),
  values: z.array(filterValueSchema).nullish(),
});

/** Ответ ручки фильтра: объект с источниками или просто список групп. */
export const filterResponseSchema = z.union([
  z.object({
    sources: z.array(filterGroupSchema).nullish(),
    other: z.array(filterGroupSchema).nullish(),
  }),
  z.array(filterGroupSchema),
]);

export type FilterResponse = z.infer<typeof filterResponseSchema>;
export type FilterGroupResponse = z.infer<typeof filterGroupSchema>;

/** Название записи: по-русски, по-английски и необязательное другое. */
export const entryNameSchema = z.object({
  rus: z.string(),
  eng: z.string(),
  alt: z.string().nullish(),
});

export type EntryName = z.infer<typeof entryNameSchema>;

/**
 * Источник записи. Группа есть у источников, привязанных к книге:
 * официальные, тестовые, сторонние и хомбрю.
 */
export const entrySourceSchema = z.object({
  shortName: z.string(),
  name: z.string(),
  group: z
    .object({
      shortName: z.string(),
      name: z.string(),
    })
    .nullish(),
  homebrew: z.boolean().nullish(),
  page: z.number().nullish(),
});

export type EntrySource = z.infer<typeof entrySourceSchema>;
