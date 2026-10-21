import { z } from 'zod';

import { rollTableSchema } from '~content/model';
import { entryNameSchema, entrySourceSchema } from '~section/model';

/** Ссылка на класс или архетип, которому доступна черта или особенность. */
const referenceClassSchema = z.object({
  name: z.string(),
  url: z.string().nullish(),
});

export type ReferenceClass = z.infer<typeof referenceClassSchema>;

/* --- Черты -------------------------------------------------------------- */

export const featLinkSchema = z.object({
  name: entryNameSchema,
  url: z.string().min(1),
  requirements: z.string().nullish(),
  source: entrySourceSchema.nullish(),
});

export type FeatLink = z.infer<typeof featLinkSchema>;

export const featDetailSchema = featLinkSchema.omit({ url: true }).extend({
  description: z.string().nullish(),
});

export type FeatDetail = z.infer<typeof featDetailSchema>;

/* --- Предыстории -------------------------------------------------------- */

export const backgroundLinkSchema = z.object({
  name: entryNameSchema,
  url: z.string().min(1),
  source: entrySourceSchema.nullish(),
});

export type BackgroundLink = z.infer<typeof backgroundLinkSchema>;

export const backgroundDetailSchema = backgroundLinkSchema
  .omit({ url: true })
  .extend({
    skills: z.array(z.string()).nullish(),
    toolOwnership: z.string().nullish(),
    language: z.string().nullish(),
    languages: z.array(z.string()).nullish(),
    equipments: z.array(z.string()).nullish(),
    startGold: z.number().nullish(),
    description: z.string().nullish(),
    skillName: z.string().nullish(),
    skillDescription: z.string().nullish(),
    personalization: z.string().nullish(),
    personalizationTables: z.array(rollTableSchema).nullish(),
  });

export type BackgroundDetail = z.infer<typeof backgroundDetailSchema>;

/* --- Особенности классов ------------------------------------------------ */

export const optionLinkSchema = z.object({
  name: entryNameSchema,
  url: z.string().min(1),
  source: entrySourceSchema.nullish(),
});

export type OptionLink = z.infer<typeof optionLinkSchema>;

export const optionDetailSchema = optionLinkSchema.omit({ url: true }).extend({
  requirements: z.string().nullish(),
  description: z.string().nullish(),
  classes: z.array(referenceClassSchema).nullish(),
});

export type OptionDetail = z.infer<typeof optionDetailSchema>;
