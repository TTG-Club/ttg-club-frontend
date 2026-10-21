import { z } from 'zod';

import { rollTableSchema } from '~content/model';
import { entryNameSchema, entrySourceSchema } from '~section/model';

/**
 * Ссылка на класс, архетип, расу или предысторию, которым доступна запись.
 * У архетипа в `class` — название его класса.
 */
const referenceClassSchema = z.object({
  name: z.string(),
  url: z.string().nullish(),
  class: z.string().nullish(),
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

/* --- Заклинания --------------------------------------------------------- */

/** Компоненты в списке — флаги; в карточке материальный — его описание. */
const spellComponentsSchema = z.object({
  v: z.boolean().nullish(),
  s: z.boolean().nullish(),
  m: z.union([z.boolean(), z.string()]).nullish(),
});

export type SpellComponents = z.infer<typeof spellComponentsSchema>;

export const spellLinkSchema = z.object({
  name: entryNameSchema,
  url: z.string().min(1),
  level: z.number(),
  school: z.string(),
  additionalType: z.string().nullish(),
  components: spellComponentsSchema.nullish(),
  ritual: z.boolean().nullish(),
  concentration: z.boolean().nullish(),
  source: entrySourceSchema.nullish(),
});

export type SpellLink = z.infer<typeof spellLinkSchema>;

export const spellDetailSchema = spellLinkSchema.omit({ url: true }).extend({
  range: z.string().nullish(),
  duration: z.string().nullish(),
  time: z.string().nullish(),
  description: z.string().nullish(),
  upper: z.string().nullish(),
  classes: z.array(referenceClassSchema).nullish(),
  subclasses: z.array(referenceClassSchema).nullish(),
  races: z.array(referenceClassSchema).nullish(),
  backgrounds: z.array(referenceClassSchema).nullish(),
  feats: z.array(referenceClassSchema).nullish(),
});

export type SpellDetail = z.infer<typeof spellDetailSchema>;
