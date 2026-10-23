import type { WorkshopArmor } from './types';

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

const workshopArmorSchema = z.object({
  id: z.number(),
  name: workshopNameSchema,
  typeRaw: z.string().nullish(),
  armorClassRaw: z.number().nullish(),
  cost: z.number().nullish(),
  weight: z.number().nullish(),
  requirement: z.number().nullish(),
  disadvantage: z.boolean().nullish(),
  description: z.string().nullish(),
  source: workshopSourceSchema,
});

/**
 * Доспех из справочника для редактора.
 * @param input - ответ сервера
 */
export function parseWorkshopArmor(input: unknown): WorkshopArmor {
  const armor = workshopArmorSchema.parse(input);

  return {
    id: armor.id,
    name: armor.name.rus,
    englishName: armor.name.eng,
    type: armor.typeRaw ?? '',
    armorClass: armor.armorClassRaw ?? null,
    cost: armor.cost ?? null,
    weight: armor.weight ?? null,
    forceRequirements: armor.requirement ?? null,
    stealthHindrance: !!armor.disadvantage,
    description: armor.description ?? '',
    source: armor.source?.shortName,
  };
}

/** Форма доспеха: те же поля, что принимает бэкенд. */
export const armorFormSchema = z.object({
  name: workshopRequiredText,
  englishName: workshopRequiredText,
  type: z.string().min(1, WORKSHOP_VALIDATION.required),
  armorClass: workshopOptionalNotNegative,
  cost: workshopOptionalNotNegative,
  weight: workshopOptionalWeight,
  forceRequirements: workshopOptionalPositive,
  stealthHindrance: z.boolean(),
  description: z.string(),
});

export type ArmorForm = z.infer<typeof armorFormSchema>;
