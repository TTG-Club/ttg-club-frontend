import { z } from 'zod';

import { entrySourceSchema } from '~section/model';

/** Вариант выбора из ручки инструмента: подпись и значение. */
const nameValueSchema = z.object({
  name: z.string(),
  value: z.string(),
});

/** Виды безумия: кратковременное, долговременное, бессрочное. */
export const madnessTypesSchema = z.array(nameValueSchema);

/** Безумие: описание и вид с выброшенной длительностью. */
export const madnessResultSchema = z.object({
  description: z.string(),
  type: z.object({
    name: z.string(),
    value: z.string(),
    additional: z.string().nullish(),
  }),
});

/** Книги, в которых есть таблицы дикой магии. */
export const wildMagicSourcesSchema = z.array(entrySourceSchema);

/** Эффект дикой магии и книга, из которой он взят. */
export const wildMagicResultSchema = z.object({
  description: z.string(),
  source: entrySourceSchema,
});

/** Варианты формы столкновений: окружения и уровни группы. */
export const encounterOptionsSchema = z.object({
  environments: z.array(nameValueSchema),
  levels: z.array(
    z.object({
      name: z.string(),
      value: z.number(),
    }),
  ),
});

/**
 * Столкновение. Если в таблице ничего не выпало, бэкенд отдаёт только
 * описание.
 */
export const encounterResultSchema = z.object({
  tableName: z.string().nullish(),
  description: z.string(),
  source: entrySourceSchema.nullish(),
});

/**
 * Расы для генератора имён. Раса без своих имён приходит, только если у неё
 * есть подрасы с именами: она становится заголовком группы.
 */
export const nameRacesSchema = z.array(
  z.object({
    id: z.number(),
    name: z.string(),
    parentId: z.number().nullish(),
    available: z.boolean(),
  }),
);

/** Готовое имя с расой и полом. */
export const nameResultSchema = z.object({
  value: z.string(),
  race: z.string(),
  sex: z.enum(['MALE', 'FEMALE', 'UNISEX']).nullish(),
});

export type ToolOption = z.infer<typeof nameValueSchema>;
export type MadnessResult = z.infer<typeof madnessResultSchema>;
export type WildMagicResult = z.infer<typeof wildMagicResultSchema>;
export type EncounterOptions = z.infer<typeof encounterOptionsSchema>;
export type EncounterResult = z.infer<typeof encounterResultSchema>;
export type NameRace = z.infer<typeof nameRacesSchema>[number];
export type NameResult = z.infer<typeof nameResultSchema>;
