import type { WorkshopMagicItem } from './types';

import { z } from 'zod';

import { WORKSHOP_VALIDATION } from '../constants';
import {
  workshopNameSchema,
  workshopOptionalNotNegative,
  workshopOptionalPositive,
  workshopRequiredText,
  workshopSourceSchema,
} from '../schemas';

const workshopMagicItemSchema = z.object({
  id: z.number(),
  name: workshopNameSchema,
  altName: z.string().nullish(),
  rarityRaw: z.string().nullish(),
  typeRaw: z.string().nullish(),
  specialRaw: z.string().nullish(),
  customization: z.boolean().nullish(),
  custSpecial: z.string().nullish(),
  consumed: z.boolean().nullish(),
  curse: z.boolean().nullish(),
  charge: z.number().nullish(),
  costRaw: z.number().nullish(),
  bonus: z.number().nullish(),
  description: z.string().nullish(),
  source: workshopSourceSchema,
});

/**
 * Магический предмет из справочника для редактора.
 * @param input - ответ сервера
 */
export function parseWorkshopMagicItem(input: unknown): WorkshopMagicItem {
  const item = workshopMagicItemSchema.parse(input);

  return {
    id: item.id,
    name: item.name.rus,
    englishName: item.name.eng,
    altName: item.altName ?? '',
    rarity: item.rarityRaw ?? '',
    type: item.typeRaw ?? '',
    special: item.specialRaw ?? '',
    customization: !!item.customization,
    custSpecial: item.custSpecial ?? '',
    consumed: !!item.consumed,
    curse: !!item.curse,
    charge: item.charge ?? null,
    cost: item.costRaw ?? null,
    bonus: item.bonus ?? null,
    description: item.description ?? '',
    source: item.source?.shortName,
  };
}

const requiredChoice = z.string().min(1, WORKSHOP_VALIDATION.required);

/** Форма магического предмета: те же поля, что принимает бэкенд. */
export const magicItemFormSchema = z.object({
  name: workshopRequiredText,
  englishName: workshopRequiredText,
  altName: z.string(),
  rarity: requiredChoice,
  type: requiredChoice,
  special: z.string(),
  customization: z.boolean(),
  custSpecial: z.string(),
  consumed: z.boolean(),
  curse: z.boolean(),
  charge: workshopOptionalPositive,
  cost: workshopOptionalNotNegative,
  bonus: workshopOptionalPositive,
  description: workshopRequiredText,
});

export type MagicItemForm = z.infer<typeof magicItemFormSchema>;
