import { z } from 'zod';

import { entryNameSchema, entrySourceSchema } from '~section/model';

/** Значение свойства существа: скорость, спасбросок, навык или действие. */
const nameValueSchema = z.object({
  name: z.string().nullish(),
  shortName: z.string().nullish(),
  englishName: z.string().nullish(),
  value: z.union([z.string(), z.number()]).nullish(),
  additional: z.union([z.string(), z.number()]).nullish(),
});

export type CreatureValue = z.infer<typeof nameValueSchema>;

export const creatureLinkSchema = z.object({
  name: entryNameSchema,
  url: z.string().min(1),
  /** Тип существа строкой, например «гуманоид». */
  type: z.string(),
  challengeRating: z.string(),
  source: entrySourceSchema.nullish(),
});

export type CreatureLink = z.infer<typeof creatureLinkSchema>;

const creatureAbilitiesSchema = z.object({
  str: z.number(),
  dex: z.number(),
  con: z.number(),
  int: z.number(),
  wiz: z.number(),
  cha: z.number(),
});

export type CreatureAbilities = z.infer<typeof creatureAbilitiesSchema>;

const creatureHitsSchema = z.object({
  average: z.number().nullish(),
  formula: z.string().nullish(),
  /** Знак бонуса с пробелами вокруг: « + » или « − ». */
  sign: z.string().nullish(),
  bonus: z.number().nullish(),
  text: z.string().nullish(),
});

export type CreatureHits = z.infer<typeof creatureHitsSchema>;

const creatureSensesSchema = z.object({
  passivePerception: z.string().nullish(),
  senses: z.array(nameValueSchema).nullish(),
});

export type CreatureSenses = z.infer<typeof creatureSensesSchema>;

export const creatureDetailSchema = creatureLinkSchema.extend({
  /** Тип существа с уточнениями, например «гуманоид (человек)». */
  type: z.object({
    name: z.string(),
    tags: z.array(z.string()).nullish(),
  }),
  experience: z.number().nullish(),
  proficiencyBonus: z.string().nullish(),
  size: z.object({
    rus: z.string(),
    eng: z.string(),
    cell: z.string().nullish(),
  }),
  alignment: z.string().nullish(),
  armorClass: z.number().nullish(),
  armors: z
    .array(z.object({ name: z.string(), url: z.string().nullish() }))
    .nullish(),
  armorText: z.string().nullish(),
  hits: creatureHitsSchema,
  speed: z.array(nameValueSchema).nullish(),
  ability: creatureAbilitiesSchema,
  savingThrows: z.array(nameValueSchema).nullish(),
  skills: z.array(nameValueSchema).nullish(),
  damageVulnerabilities: z.array(z.string()).nullish(),
  damageResistances: z.array(z.string()).nullish(),
  damageImmunities: z.array(z.string()).nullish(),
  conditionImmunities: z.array(z.string()).nullish(),
  senses: creatureSensesSchema.nullish(),
  languages: z.array(z.string()).nullish(),
  language: z.string().nullish(),
  feats: z.array(nameValueSchema).nullish(),
  actions: z.array(nameValueSchema).nullish(),
  bonusActions: z.array(nameValueSchema).nullish(),
  reactions: z.array(nameValueSchema).nullish(),
  reaction: z.string().nullish(),
  legendary: z
    .object({
      list: z.array(nameValueSchema).nullish(),
      description: z.string().nullish(),
    })
    .nullish(),
  mysticalActions: z.array(nameValueSchema).nullish(),
  lair: z
    .object({
      description: z.string().nullish(),
      action: z.string().nullish(),
      effect: z.string().nullish(),
    })
    .nullish(),
  environment: z.array(z.string()).nullish(),
  description: z.string().nullish(),
  tags: z
    .array(z.object({ name: z.string(), description: z.string().nullish() }))
    .nullish(),
  images: z.array(z.string()).nullish(),
});

export type CreatureDetail = z.infer<typeof creatureDetailSchema>;
