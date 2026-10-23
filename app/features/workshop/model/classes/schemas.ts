import type {
  ClassTableColumn,
  ClassTrait,
  WorkshopArchetype,
  WorkshopClass,
} from './types';

import { z } from 'zod';

import { WORKSHOP_VALIDATION } from '../constants';
import {
  workshopNameSchema,
  workshopOptionalPositive,
  workshopRequiredText,
  workshopSourceSchema,
} from '../schemas';
import {
  CLASS_DEFAULT,
  CLASS_LEVELS,
  INFINITE_CLASS_TABLE_VALUE,
  MAX_CLASS_TABLE_VALUE,
} from './constants';

const classTraitSchema = z.object({
  id: z.number().nullish(),
  name: z.string(),
  suffix: z.string().nullish(),
  level: z.number(),
  description: z.string().nullish(),
  optional: z.boolean().catch(false),
  child: z.string().nullish(),
});

const classTableColumnSchema = z.object({
  id: z.number().nullish(),
  name: z.string(),
  prefix: z.string().nullish(),
  suffix: z.string().nullish(),
  levels: z.array(z.number().nullable()).catch([]),
});

const workshopClassSchema = z.object({
  id: z.number(),
  name: workshopNameSchema,
  accusativeName: z.string().nullish(),
  description: z.string().nullish(),
  archetypeName: z.string().nullish(),
  spellAbility: z.string().nullish(),
  spellcasterType: z.string().nullish(),
  primaryAbilities: z.array(z.string()).catch([]),
  availableSkillsRaw: z.array(z.string()).catch([]),
  optionType: z.string().nullish(),
  slotsReset: z.string().nullish(),
  enabledArhitypeLevel: z.number().catch(0),
  sidekick: z.boolean().catch(false),
  icon: z.string().nullish(),
  page: z.number().nullish(),
  classTraits: z.array(classTraitSchema).catch([]),
  tableColumns: z.array(classTableColumnSchema).catch([]),
  traits: z
    .object({
      diceHp: z.number(),
      armor: z.string().nullish(),
      weapon: z.string().nullish(),
      tools: z.string().nullish(),
      savingThrows: z.string().nullish(),
      skillAvailableCount: z.number().catch(0),
      equipment: z.string().nullish(),
    })
    .nullish(),
  source: workshopSourceSchema,
});

const workshopArchetypeSchema = z.object({
  id: z.number(),
  name: z.string(),
  englishName: z.string(),
  genitiveName: z.string().nullish(),
  description: z.string().nullish(),
  level: z.number(),
  spellcasterType: z.string().nullish(),
  optionType: z.string().nullish(),
  spellLevelType: z.string().nullish(),
  page: z.number().nullish(),
  traits: z.array(classTraitSchema).catch([]),
  tableColumns: z.array(classTableColumnSchema).catch([]),
});

/**
 * Умение из ответа сервера.
 * @param trait - умение
 */
function toClassTrait(trait: z.infer<typeof classTraitSchema>): ClassTrait {
  return {
    id: trait.id ?? undefined,
    name: trait.name,
    suffix: trait.suffix ?? '',
    level: trait.level,
    description: trait.description ?? '',
    optional: trait.optional,
    child: trait.child ?? '',
  };
}

/**
 * Колонка таблицы из ответа сервера: значения дополняются до двадцати
 * уровней.
 * @param column - колонка
 */
function toClassTableColumn(
  column: z.infer<typeof classTableColumnSchema>,
): ClassTableColumn {
  return {
    id: column.id ?? undefined,
    name: column.name,
    prefix: column.prefix ?? '',
    suffix: column.suffix ?? '',
    levels: CLASS_LEVELS.map((_, index) => column.levels[index] ?? null),
  };
}

/**
 * Класс из справочника для редактора. Кость хитов, доспехи и навыки
 * карточка отдаёт в блоке `traits`.
 * @param input - ответ сервера
 */
export function parseWorkshopClass(input: unknown): WorkshopClass {
  const heroClass = workshopClassSchema.parse(input);
  const traits = heroClass.traits;

  return {
    id: heroClass.id,
    name: heroClass.name.rus,
    englishName: heroClass.name.eng,
    accusativeName: heroClass.accusativeName ?? '',
    description: heroClass.description ?? '',
    diceHp: traits?.diceHp ?? CLASS_DEFAULT.diceHp,
    armor: traits?.armor ?? '',
    weapon: traits?.weapon ?? '',
    tools: traits?.tools ?? '',
    savingThrows: traits?.savingThrows ?? '',
    archetypeName: heroClass.archetypeName ?? '',
    equipment: traits?.equipment ?? '',
    spellAbility: heroClass.spellAbility ?? '',
    spellcasterType: heroClass.spellcasterType ?? CLASS_DEFAULT.spellcasterType,
    primaryAbilities: heroClass.primaryAbilities,
    enabledArhitypeLevel: heroClass.enabledArhitypeLevel,
    skillAvailableCount: traits?.skillAvailableCount ?? 0,
    availableSkills: heroClass.availableSkillsRaw,
    optionType: heroClass.optionType ?? '',
    slotsReset: heroClass.slotsReset ?? '',
    sidekick: heroClass.sidekick,
    icon: heroClass.icon ?? '',
    page: heroClass.page ?? null,
    classTraits: heroClass.classTraits.map(toClassTrait),
    tableColumns: heroClass.tableColumns.map(toClassTableColumn),
    source: heroClass.source?.shortName,
  };
}

/**
 * Архетип из мастерской для редактора.
 * @param input - ответ сервера
 */
export function parseWorkshopArchetype(input: unknown): WorkshopArchetype {
  const archetype = workshopArchetypeSchema.parse(input);

  return {
    id: archetype.id,
    name: archetype.name,
    englishName: archetype.englishName,
    genitiveName: archetype.genitiveName ?? '',
    description: archetype.description ?? '',
    level: archetype.level,
    spellcasterType: archetype.spellcasterType ?? undefined,
    optionType: archetype.optionType ?? undefined,
    spellLevelType: archetype.spellLevelType ?? CLASS_DEFAULT.spellLevelType,
    page: archetype.page ?? null,
    traits: archetype.traits.map(toClassTrait),
    tableColumns: archetype.tableColumns.map(toClassTableColumn),
  };
}

/** Уровень класса: от 1 до 20. */
const classLevelSchema = z
  .number(WORKSHOP_VALIDATION.positive)
  .int(WORKSHOP_VALIDATION.positive)
  .min(1, WORKSHOP_VALIDATION.positive)
  .max(CLASS_LEVELS.length, WORKSHOP_VALIDATION.classLevel);

/** Неотрицательное целое поле формы. */
const notNegativeSchema = z
  .number(WORKSHOP_VALIDATION.notNegative)
  .int(WORKSHOP_VALIDATION.notNegative)
  .min(0, WORKSHOP_VALIDATION.notNegative);

/** Умение в форме. */
export const classTraitFormSchema = z.object({
  id: z.number().optional(),
  name: workshopRequiredText,
  suffix: z.string(),
  level: classLevelSchema,
  description: workshopRequiredText,
  optional: z.boolean(),
  child: z.string(),
});

/** Колонка таблицы прогрессии в форме. */
export const classTableColumnFormSchema = z.object({
  id: z.number().optional(),
  name: workshopRequiredText,
  prefix: z.string(),
  suffix: z.string(),
  levels: z
    .array(
      z
        .number(WORKSHOP_VALIDATION.tableValue)
        .int(WORKSHOP_VALIDATION.tableValue)
        .min(INFINITE_CLASS_TABLE_VALUE, WORKSHOP_VALIDATION.tableValue)
        .max(MAX_CLASS_TABLE_VALUE, WORKSHOP_VALIDATION.tableValue)
        .nullable(),
    )
    .length(CLASS_LEVELS.length),
});

/** Форма класса: те же поля, что принимает бэкенд. */
export const classFormSchema = z.object({
  name: workshopRequiredText,
  englishName: workshopRequiredText,
  accusativeName: z.string(),
  diceHp: z.number(),
  primaryAbilities: z.array(z.string()),
  savingThrows: z.string(),
  skillAvailableCount: notNegativeSchema,
  availableSkills: z.array(z.string()),
  spellcasterType: z.string(),
  spellAbility: z.string().optional(),
  archetypeName: z.string(),
  enabledArhitypeLevel: notNegativeSchema.max(
    CLASS_LEVELS.length,
    WORKSHOP_VALIDATION.classLevel,
  ),
  optionType: z.string().optional(),
  slotsReset: z.string().optional(),
  icon: z.string(),
  page: workshopOptionalPositive,
  sidekick: z.boolean(),
  armor: z.string(),
  weapon: z.string(),
  tools: z.string(),
  equipment: z.string(),
  description: workshopRequiredText,
  classTraits: z.array(classTraitFormSchema),
  tableColumns: z.array(classTableColumnFormSchema),
});

export type ClassForm = z.infer<typeof classFormSchema>;

/** Форма архетипа: те же поля, что принимает бэкенд. */
export const archetypeFormSchema = z.object({
  name: workshopRequiredText,
  englishName: workshopRequiredText,
  genitiveName: z.string(),
  level: classLevelSchema,
  spellLevelType: z.string(),
  page: workshopOptionalPositive,
  description: workshopRequiredText,
  traits: z.array(classTraitFormSchema),
  tableColumns: z.array(classTableColumnFormSchema),
});

export type ArchetypeForm = z.infer<typeof archetypeFormSchema>;
