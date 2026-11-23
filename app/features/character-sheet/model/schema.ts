import { range } from 'es-toolkit';
import { z } from 'zod';

import { classDetailSchema } from '~character/model';
import { weaponDetailSchema } from '~inventory/model';

import {
  ABILITY_KEYS,
  ABILITY_SCORE,
  ARMOR_CATEGORIES,
  CHARACTER_LEVEL,
  DEATH_SAVES_MAX,
  RESOURCE_RESETS,
  SHEET_SCHEMA_VERSION,
  SKILL_KEYS,
  SPELL_LEVEL,
  SPELL_SLOT_LEVELS,
} from './constants';

/*
 * Документ листа. Каждое поле с запасным значением (`catch`): лист, сохранённый
 * старой версией формата или испорченный вручную, открывается с пустыми
 * значениями на месте непонятных полей, а не падает целиком.
 */

export const abilityKeySchema = z.enum(ABILITY_KEYS);

export const skillKeySchema = z.enum(SKILL_KEYS);

const integerSchema = z.number().int();

/** Неотрицательное целое; мусор — 0. */
const countSchema = integerSchema.min(0).catch(0);

/** Строка; мусор — пустая строка. */
const textSchema = z.string().catch('');

/** Ссылка на запись справочника; `url` нет у своих записей. */
export const catalogRefSchema = z.object({
  name: z.string(),
  url: z.string().nullable().catch(null),
});

export type CatalogRef = z.infer<typeof catalogRefSchema>;

export const sheetClassSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().nullable().catch(null),
  archetypeName: z.string().nullable().catch(null),
  archetypeUrl: z.string().nullable().catch(null),
  level: integerSchema
    .min(CHARACTER_LEVEL.min)
    .max(CHARACTER_LEVEL.max)
    .catch(CHARACTER_LEVEL.min),
  hitDie: integerSchema.min(1).catch(8),
});

export type SheetClass = z.infer<typeof sheetClassSchema>;

const abilityScoreSchema = integerSchema
  .min(ABILITY_SCORE.min)
  .max(ABILITY_SCORE.max)
  .catch(ABILITY_SCORE.default);

export const abilityScoresSchema = z.object({
  STRENGTH: abilityScoreSchema,
  DEXTERITY: abilityScoreSchema,
  CONSTITUTION: abilityScoreSchema,
  INTELLIGENCE: abilityScoreSchema,
  WISDOM: abilityScoreSchema,
  CHARISMA: abilityScoreSchema,
});

export type AbilityScores = z.infer<typeof abilityScoresSchema>;

/** Бонусы расы, прибавленные к характеристикам: снимаются при смене расы. */
const abilityBonusesSchema = z
  .partialRecord(abilityKeySchema, integerSchema)
  .catch({});

export type AbilityBonuses = z.infer<typeof abilityBonusesSchema>;

export const skillProficiencySchema = z.enum([
  'none',
  'proficient',
  'expertise',
]);

export type SkillProficiency = z.infer<typeof skillProficiencySchema>;

const skillProficienciesSchema = z
  .partialRecord(skillKeySchema, skillProficiencySchema)
  .catch({});

export type SkillProficiencies = z.infer<typeof skillProficienciesSchema>;

const healthSchema = z.object({
  max: countSchema,
  current: countSchema,
  temporary: countSchema,
});

export type SheetHealth = z.infer<typeof healthSchema>;

const deathSavesSchema = z.object({
  successes: integerSchema.min(0).max(DEATH_SAVES_MAX).catch(0),
  failures: integerSchema.min(0).max(DEATH_SAVES_MAX).catch(0),
});

export type DeathSaves = z.infer<typeof deathSavesSchema>;

/** Потраченные кости хитов по размеру кости: `{ "10": 2 }`. */
const hitDiceUsedSchema = z.record(z.string(), countSchema).catch({});

const proficienciesSchema = z.object({
  armor: textSchema,
  weapons: textSchema,
  tools: textSchema,
  languages: textSchema,
});

export type SheetProficiencies = z.infer<typeof proficienciesSchema>;

const currencySchema = z.object({
  cp: countSchema,
  sp: countSchema,
  ep: countSchema,
  gp: countSchema,
  pp: countSchema,
});

export type SheetCurrency = z.infer<typeof currencySchema>;

export const armorCategorySchema = z.enum(ARMOR_CATEGORIES);

export type ArmorCategory = z.infer<typeof armorCategorySchema>;

export const sheetWeaponSchema = z.object({
  /** Кость урона в записи справочника: «1к8». */
  damage: textSchema,
  damageType: textSchema,
  isRanged: z.boolean().catch(false),
  isFinesse: z.boolean().catch(false),
  isProficient: z.boolean().catch(true),
  /** Магический бонус к атаке и урону. */
  bonus: integerSchema.catch(0),
});

export type SheetWeapon = z.infer<typeof sheetWeaponSchema>;

export const sheetArmorSchema = z.object({
  category: armorCategorySchema,
  baseArmorClass: integerSchema.min(0).catch(0),
  strengthRequirement: integerSchema.min(0).nullable().catch(null),
  stealthDisadvantage: z.boolean().catch(false),
  /** Магический бонус к КД. */
  bonus: integerSchema.catch(0),
});

export type SheetArmor = z.infer<typeof sheetArmorSchema>;

export const sheetItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().nullable().catch(null),
  quantity: countSchema,
  /** Вес одной штуки в фунтах. */
  weight: z.number().min(0).catch(0),
  isEquipped: z.boolean().catch(false),
  notes: textSchema,
  weapon: sheetWeaponSchema.nullable().catch(null),
  armor: sheetArmorSchema.nullable().catch(null),
});

export type SheetItem = z.infer<typeof sheetItemSchema>;

export const sheetSpellSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().nullable().catch(null),
  level: integerSchema.min(SPELL_LEVEL.min).max(SPELL_LEVEL.max).catch(0),
  school: textSchema,
  isPrepared: z.boolean().catch(false),
  isRitual: z.boolean().catch(false),
  isConcentration: z.boolean().catch(false),
  notes: textSchema,
});

export type SheetSpell = z.infer<typeof sheetSpellSchema>;

export const sheetFeatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  source: textSchema,
  description: textSchema,
});

export type SheetFeature = z.infer<typeof sheetFeatureSchema>;

export const resourceResetSchema = z.enum(RESOURCE_RESETS);

export type ResourceReset = z.infer<typeof resourceResetSchema>;

export const sheetResourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  max: countSchema,
  used: countSchema,
  reset: resourceResetSchema.catch('LONG'),
});

export type SheetResource = z.infer<typeof sheetResourceSchema>;

export const sheetNoteSchema = z.object({
  id: z.string(),
  title: textSchema,
  text: textSchema,
});

export type SheetNote = z.infer<typeof sheetNoteSchema>;

const personalitySchema = z.object({
  traits: textSchema,
  ideals: textSchema,
  bonds: textSchema,
  flaws: textSchema,
  appearance: textSchema,
  backstory: textSchema,
});

export type SheetPersonality = z.infer<typeof personalitySchema>;

/** Список, из которого выброшены испорченные элементы. */
function lenientList<Element extends z.ZodType>(
  element: Element,
): z.ZodType<Array<z.infer<Element>>> {
  return z
    .array(z.unknown())
    .catch([])
    .transform((values) =>
      values.flatMap((value) => {
        const parsed = element.safeParse(value);

        return parsed.success ? [parsed.data] : [];
      }),
    );
}

export const sheetDocumentSchema = z.object({
  schemaVersion: z.literal(SHEET_SCHEMA_VERSION).catch(SHEET_SCHEMA_VERSION),
  race: catalogRefSchema.nullable().catch(null),
  raceAbilityBonuses: abilityBonusesSchema,
  background: catalogRefSchema.nullable().catch(null),
  alignment: textSchema,
  classes: lenientList(sheetClassSchema),
  experience: countSchema,
  inspiration: z.boolean().catch(false),
  abilities: abilityScoresSchema.catch({
    STRENGTH: ABILITY_SCORE.default,
    DEXTERITY: ABILITY_SCORE.default,
    CONSTITUTION: ABILITY_SCORE.default,
    INTELLIGENCE: ABILITY_SCORE.default,
    WISDOM: ABILITY_SCORE.default,
    CHARISMA: ABILITY_SCORE.default,
  }),
  savingThrows: lenientList(abilityKeySchema),
  skills: skillProficienciesSchema,
  /** Своё значение КД; null — КД считается по снаряжению. */
  armorClassOverride: integerSchema.min(0).nullable().catch(null),
  armorClassBonus: integerSchema.catch(0),
  initiativeBonus: integerSchema.catch(0),
  speed: countSchema,
  darkvision: countSchema,
  health: healthSchema.catch({ max: 0, current: 0, temporary: 0 }),
  hitDiceUsed: hitDiceUsedSchema,
  deathSaves: deathSavesSchema.catch({ successes: 0, failures: 0 }),
  proficiencies: proficienciesSchema.catch({
    armor: '',
    weapons: '',
    tools: '',
    languages: '',
  }),
  currency: currencySchema.catch({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }),
  inventory: lenientList(sheetItemSchema),
  spellcastingAbility: abilityKeySchema.nullable().catch(null),
  /** Потраченные ячейки 1–9 кругов. */
  spellSlotsUsed: z
    .array(countSchema)
    .catch([])
    .transform((values) =>
      range(SPELL_SLOT_LEVELS).map((index) => values[index] ?? 0),
    ),
  pactSlotsUsed: countSchema,
  spells: lenientList(sheetSpellSchema),
  features: lenientList(sheetFeatureSchema),
  resources: lenientList(sheetResourceSchema),
  personality: personalitySchema.catch({
    traits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    appearance: '',
    backstory: '',
  }),
  notes: lenientList(sheetNoteSchema),
});

export type SheetDocument = z.infer<typeof sheetDocumentSchema>;

/* --- Ответы API листов -------------------------------------------------- */

export const characterSheetSchema = z.object({
  id: z.string(),
  name: z.string(),
  data: z
    .unknown()
    .transform((value) => sheetDocumentSchema.parse(value ?? {})),
  version: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CharacterSheet = z.infer<typeof characterSheetSchema>;

export const characterSheetListSchema = z.object({
  items: z.array(characterSheetSchema),
  used: z.number(),
  limit: z.number(),
});

export type CharacterSheetList = z.infer<typeof characterSheetListSchema>;

/* --- Справочники -------------------------------------------------------- */

/** Колонка таблицы класса: значение по уровням (0 — нет, -1 — без ограничений). */
const classTableColumnSchema = z.object({
  name: z.string(),
  levels: z.array(z.number()),
});

export type ClassTableColumn = z.infer<typeof classTableColumnSchema>;

/**
 * Класс для листа: к записи раздела добавлены поля механики, которые раздел
 * не показывает. У архетипа их нет — они берутся из основного класса.
 */
export const sheetClassDetailSchema = classDetailSchema.extend({
  spellAbility: abilityKeySchema.nullish(),
  availableSkillsRaw: z.array(z.string()).nullish(),
  enabledArhitypeLevel: z.number().nullish(),
  tableColumns: z.array(classTableColumnSchema).nullish(),
});

export type SheetClassDetail = z.infer<typeof sheetClassDetailSchema>;

/** Оружие для листа: к записи раздела добавлены тип и кость урона. */
export const sheetWeaponDetailSchema = weaponDetailSchema.extend({
  typeRaw: z.string().nullish(),
});

export type SheetWeaponDetail = z.infer<typeof sheetWeaponDetailSchema>;

/** Доспех для листа: базовый КД и категория числами, а не подписью. */
export const sheetArmorDetailSchema = z.object({
  armorClassRaw: z.number().nullish(),
  typeRaw: armorCategorySchema.nullish(),
  weight: z.number().nullish(),
  disadvantage: z.boolean().nullish(),
  requirement: z.number().nullish(),
});

export type SheetArmorDetail = z.infer<typeof sheetArmorDetailSchema>;

/** Вес предмета снаряжения или магического предмета. */
export const sheetWeightDetailSchema = z.object({
  weight: z.number().nullish(),
});

/** Заклинание для листа: ритуал и концентрация есть уже в списке. */
export const sheetSpellDetailSchema = z.object({
  level: z.number(),
  school: z.string().nullish(),
  ritual: z.boolean().nullish(),
  concentration: z.boolean().nullish(),
});
