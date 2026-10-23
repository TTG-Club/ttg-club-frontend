import type { SelectOption } from '../types';
import type { WorkshopRace } from './types';

import { z } from 'zod';

import { WORKSHOP_VALIDATION } from '../constants';
import {
  workshopNameSchema,
  workshopOptionalNotNegative,
  workshopOptionalPositive,
  workshopRequiredText,
  workshopSourceSchema,
} from '../schemas';
import { RACE_DEFAULT } from './constants';

const raceFeatureSchema = z.object({
  id: z.number().nullish(),
  name: z.string(),
  englishName: z.string().nullish(),
  description: z.string().nullish(),
  feature: z.boolean().catch(false),
  replaceFeatureId: z.number().nullish(),
});

const workshopRaceSchema = z.object({
  id: z.number(),
  name: workshopNameSchema,
  altName: z.string().nullish(),
  parentId: z.number().nullish(),
  sizeRaw: z.string().nullish(),
  typeRaw: z.string().nullish(),
  minAge: z.number().nullish(),
  maxAge: z.number().nullish(),
  speed: z.array(z.object({ value: z.number() })).catch([]),
  darkvision: z.number().nullish(),
  fly: z.number().nullish(),
  climb: z.number().nullish(),
  swim: z.number().nullish(),
  origin: z.boolean().nullish(),
  view: z.boolean().catch(true),
  icon: z.string().nullish(),
  page: z.number().nullish(),
  abilities: z
    .array(z.object({ key: z.string(), value: z.number().nullish() }))
    .catch([]),
  features: z.array(raceFeatureSchema).catch([]),
  description: z.string().nullish(),
  source: workshopSourceSchema,
});

const raceListSchema = z.array(
  z.object({ id: z.number(), name: workshopNameSchema }),
);

/**
 * Раса из справочника для редактора. Первая скорость карточки — ходьба,
 * остальные она собирает из полёта, лазания и плавания.
 * @param input - ответ сервера
 */
export function parseWorkshopRace(input: unknown): WorkshopRace {
  const race = workshopRaceSchema.parse(input);

  return {
    id: race.id,
    name: race.name.rus,
    englishName: race.name.eng,
    altName: race.altName ?? '',
    parentId: race.parentId ? String(race.parentId) : '',
    size: race.sizeRaw ?? RACE_DEFAULT.size,
    type: race.typeRaw ?? RACE_DEFAULT.type,
    minAge: race.minAge ?? null,
    maxAge: race.maxAge ?? null,
    speed: race.speed[0]?.value ?? RACE_DEFAULT.speed,
    darkvision: race.darkvision ?? null,
    fly: race.fly ?? null,
    climb: race.climb ?? null,
    swim: race.swim ?? null,
    origin: !!race.origin,
    view: race.view,
    icon: race.icon ?? '',
    page: race.page ?? null,
    abilities: race.abilities.map((ability) => ({
      ability: ability.key,
      bonus: ability.value ?? null,
    })),
    features: race.features.map((feature) => ({
      id: feature.id ?? undefined,
      name: feature.name,
      englishName: feature.englishName ?? '',
      description: feature.description ?? '',
      feature: feature.feature,
      replaceFeatureId: feature.replaceFeatureId ?? null,
    })),
    description: race.description ?? '',
    source: race.source?.shortName,
  };
}

/**
 * Расы для выбора родительской: «Эльф (Elf)». Сама раса в список не
 * попадает.
 * @param input - ответ списка рас
 * @param excludeId - идентификатор редактируемой расы
 */
export function parseRaceParentOptions(
  input: unknown,
  excludeId?: number,
): Array<SelectOption> {
  return raceListSchema
    .catch([])
    .parse(input)
    .filter((race) => race.id !== excludeId)
    .map((race) => ({
      label: `${race.name.rus} (${race.name.eng})`,
      value: String(race.id),
    }));
}

/** Форма расы: те же поля, что принимает бэкенд. */
export const raceFormSchema = z.object({
  name: workshopRequiredText,
  englishName: workshopRequiredText,
  altName: z.string(),
  parentId: z.string().optional(),
  size: z.string().min(1, WORKSHOP_VALIDATION.required),
  type: z.string().min(1, WORKSHOP_VALIDATION.required),
  minAge: workshopOptionalNotNegative,
  maxAge: workshopOptionalNotNegative,
  speed: z
    .number(WORKSHOP_VALIDATION.notNegative)
    .int(WORKSHOP_VALIDATION.notNegative)
    .min(0, WORKSHOP_VALIDATION.notNegative),
  darkvision: workshopOptionalNotNegative,
  fly: workshopOptionalNotNegative,
  climb: workshopOptionalNotNegative,
  swim: workshopOptionalNotNegative,
  origin: z.boolean(),
  view: z.boolean(),
  icon: z.string(),
  page: workshopOptionalPositive,
  abilities: z.array(
    z.object({
      ability: z.string().min(1, WORKSHOP_VALIDATION.required),
      bonus: z.number().int().nullable(),
    }),
  ),
  features: z.array(
    z.object({
      id: z.number().optional(),
      name: workshopRequiredText,
      englishName: z.string(),
      description: workshopRequiredText,
      feature: z.boolean(),
      replaceFeatureId: workshopOptionalPositive,
    }),
  ),
  description: workshopRequiredText,
});

export type RaceForm = z.infer<typeof raceFormSchema>;
