import type { WorkshopWeapon } from './types';

import { z } from 'zod';

import { WORKSHOP_VALIDATION } from '../constants';
import {
  workshopNameSchema,
  workshopOptionalNotNegative,
  workshopOptionalPositive,
  workshopOptionalWeight,
  workshopRequiredText,
  workshopSourceSchema,
} from '../schemas';

const workshopWeaponSchema = z.object({
  id: z.number(),
  name: workshopNameSchema,
  typeRaw: z.string().nullish(),
  damageType: z.string().nullish(),
  numberDice: z.number().nullish(),
  damageDice: z.string().nullish(),
  twoHandDamageDice: z.string().nullish(),
  cost: z.number().nullish(),
  currency: z.string().nullish(),
  weight: z.number().nullish(),
  minDistance: z.number().nullish(),
  maxDistance: z.number().nullish(),
  ammo: z.number().nullish(),
  propertyIds: z.array(z.number()).nullish(),
  description: z.string().nullish(),
  special: z.string().nullish(),
  source: workshopSourceSchema,
});

/**
 * Оружие из справочника для редактора.
 * @param input - ответ сервера
 */
export function parseWorkshopWeapon(input: unknown): WorkshopWeapon {
  const weapon = workshopWeaponSchema.parse(input);

  return {
    id: weapon.id,
    name: weapon.name.rus,
    englishName: weapon.name.eng,
    type: weapon.typeRaw ?? '',
    damageType: weapon.damageType ?? '',
    numberDice: weapon.numberDice ?? null,
    damageDice: weapon.damageDice ?? '',
    twoHandDamageDice: weapon.twoHandDamageDice ?? '',
    cost: weapon.cost ?? null,
    currency: weapon.currency ?? '',
    weight: weapon.weight ?? null,
    minDistance: weapon.minDistance ?? null,
    maxDistance: weapon.maxDistance ?? null,
    ammo: weapon.ammo ?? null,
    properties: (weapon.propertyIds ?? []).map(String),
    description: weapon.description ?? '',
    special: weapon.special ?? '',
    source: weapon.source?.shortName,
  };
}

const requiredChoice = z.string().min(1, WORKSHOP_VALIDATION.required);

/** Форма оружия: те же поля, что принимает бэкенд. */
export const weaponFormSchema = z
  .object({
    name: workshopRequiredText,
    englishName: workshopRequiredText,
    type: requiredChoice,
    damageType: requiredChoice,
    numberDice: workshopOptionalPositive,
    damageDice: z.string().optional(),
    twoHandDamageDice: z.string().optional(),
    cost: workshopOptionalNotNegative,
    currency: z.string().optional(),
    weight: workshopOptionalWeight,
    minDistance: workshopOptionalPositive,
    maxDistance: workshopOptionalPositive,
    ammo: workshopOptionalPositive,
    properties: z.array(z.string()),
    description: z.string(),
    special: z.string(),
  })
  .refine(
    ({ minDistance, maxDistance }) =>
      !minDistance || !maxDistance || maxDistance >= minDistance,
    { message: WORKSHOP_VALIDATION.distance, path: ['maxDistance'] },
  );

export type WeaponForm = z.infer<typeof weaponFormSchema>;
