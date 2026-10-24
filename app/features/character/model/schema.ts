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

/* --- Расы --------------------------------------------------------------- */

/** Бонус к характеристике: значение или выбор («Две на выбор»). */
const raceAbilitySchema = z.object({
  name: z.string(),
  shortName: z.string().nullish(),
  value: z.number().nullish(),
});

export type RaceAbility = z.infer<typeof raceAbilitySchema>;

/**
 * Тип книги в списке: по нему разновидности рас и архетипы классов
 * делятся на группы.
 */
const bookTypeSchema = z.object({
  name: z.string(),
  order: z.number(),
});

/** Ссылка на разновидность расы или архетип класса с типом книги. */
export const typedLinkSchema = z.object({
  name: entryNameSchema,
  url: z.string().min(1),
  type: bookTypeSchema,
  source: entrySourceSchema.nullish(),
});

export type TypedLink = z.infer<typeof typedLinkSchema>;

export const raceLinkSchema = typedLinkSchema.extend({
  image: z.string().nullish(),
  abilities: z.array(raceAbilitySchema).nullish(),
  group: z.object({ name: z.string(), order: z.number() }).nullish(),
  subraces: z.array(typedLinkSchema).nullish(),
});

export type RaceLink = z.infer<typeof raceLinkSchema>;

const raceFeatureSchema = z.object({
  name: z.string(),
  description: z.string().nullish(),
});

/** Особенность расы; `opened` раскрыта сразу, `subrace` — от разновидности. */
const raceSkillSchema = raceFeatureSchema.extend({
  subrace: z.boolean().nullish(),
  opened: z.boolean().nullish(),
});

export type RaceSkill = z.infer<typeof raceSkillSchema>;

const raceSpeedSchema = z.object({
  name: z.string().nullish(),
  value: z.number(),
});

export type RaceSpeed = z.infer<typeof raceSpeedSchema>;

const subraceDetailSchema = z.object({
  name: entryNameSchema,
  source: entrySourceSchema.nullish(),
  description: z.string().nullish(),
  features: z.array(raceFeatureSchema).nullish(),
  skills: z.array(raceFeatureSchema).nullish(),
});

export type SubraceDetail = z.infer<typeof subraceDetailSchema>;

export const raceDetailSchema = z.object({
  name: entryNameSchema,
  source: entrySourceSchema.nullish(),
  abilities: z.array(raceAbilitySchema).nullish(),
  type: z.string().nullish(),
  size: z.string().nullish(),
  speed: z.array(raceSpeedSchema).nullish(),
  darkvision: z.number().nullish(),
  images: z.array(z.string()).nullish(),
  description: z.string().nullish(),
  skills: z.array(raceSkillSchema).nullish(),
  subraces: z.array(subraceDetailSchema).nullish(),
  /** Основная раса со ссылками на разновидности, для выбора разновидности. */
  baseRace: raceLinkSchema.nullish(),
});

export type RaceDetail = z.infer<typeof raceDetailSchema>;

/* --- Классы ------------------------------------------------------------- */

const classGroupSchema = z.object({
  name: z.string(),
  order: z.number(),
});

export const classLinkSchema = z.object({
  name: entryNameSchema,
  url: z.string().min(1),
  source: entrySourceSchema,
  dice: z.string().nullish(),
  image: z.string().nullish(),
  icon: z.string().nullish(),
  group: classGroupSchema.nullish(),
  /** Как называются архетипы класса: «Подклассы», «Божественные домены»… */
  archetypeName: z.string().nullish(),
  archetypes: z.array(typedLinkSchema).nullish(),
});

export type ClassLink = z.infer<typeof classLinkSchema>;

/** Вкладка страницы класса; `url` — ручка текста или фильтра списка. */
const classTabSchema = z.object({
  name: z.string(),
  url: z.string(),
  type: z.string(),
  order: z.number(),
});

/** Умение в таблице уровней: ссылка на якорь его описания ниже. */
const classTraitLinkSchema = z.object({
  name: z.string(),
  anchor: z.string(),
  archetypeFeature: z.boolean().nullish(),
});

export type ClassTraitLink = z.infer<typeof classTraitLinkSchema>;

const classLevelSchema = z.object({
  level: z.number(),
  proficiencyBonus: z.number(),
  traits: z.array(classTraitLinkSchema),
  classFeatureValues: z.array(z.string()),
  archetypeFeatureValues: z.array(z.string()),
  spellSlots: z.array(z.string()),
});

export type ClassLevel = z.infer<typeof classLevelSchema>;

/**
 * Умение класса или архетипа. `archetypeRoot` — сам архетип: на своём
 * уровне он идёт перед остальными умениями.
 */
const classFeatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number(),
  type: z.string().nullish(),
  description: z.string().nullish(),
  optional: z.boolean().nullish(),
  archetypeFeature: z.boolean().nullish(),
  archetypeRoot: z.boolean().nullish(),
  source: z
    .object({ name: z.string().nullish(), shortName: z.string().nullish() })
    .nullish(),
});

export type ClassFeature = z.infer<typeof classFeatureSchema>;

const classColumnSchema = z.object({
  name: z.string(),
});

const classTraitsSchema = z.object({
  diceHp: z.number(),
  armor: z.string().nullish(),
  weapon: z.string().nullish(),
  tools: z.string().nullish(),
  savingThrows: z.string().nullish(),
  skillAvailableCount: z.number(),
  availableSkills: z.array(z.string()).nullish(),
  equipment: z.string().nullish(),
  classFeatureLevels: z.array(classColumnSchema).nullish(),
  archetypeFeatureLevels: z.array(classColumnSchema).nullish(),
  levels: z.array(classLevelSchema).nullish(),
  features: z.array(classFeatureSchema).nullish(),
  archetype: classFeatureSchema.nullish(),
});

export type ClassTraits = z.infer<typeof classTraitsSchema>;

const archetypeSpellSchema = z.object({
  name: z.string(),
  englishName: z.string(),
  url: z.string(),
  advanced: z.string().nullish(),
});

export type ArchetypeSpell = z.infer<typeof archetypeSpellSchema>;

/** Заклинания архетипа по уровням класса или уровням заклинаний. */
const archetypeSpellTableSchema = z.object({
  levelType: z.string().nullish(),
  classNameGenitive: z.string().nullish(),
  levels: z.array(
    z.object({
      level: z.number(),
      spells: z.array(archetypeSpellSchema),
    }),
  ),
});

export type ArchetypeSpellTable = z.infer<typeof archetypeSpellTableSchema>;

export const classDetailSchema = classLinkSchema.extend({
  tabs: z.array(classTabSchema).nullish(),
  images: z.array(z.string()).nullish(),
  description: z.string().nullish(),
  traits: classTraitsSchema.nullish(),
  archetypeSpellTable: archetypeSpellTableSchema.nullish(),
});

export type ClassDetail = z.infer<typeof classDetailSchema>;
