import type { WorkshopItem } from './types';

import { z } from 'zod';

import {
  workshopNameSchema,
  workshopOptionalNotNegative,
  workshopOptionalWeight,
  workshopRequiredText,
  workshopSourceSchema,
} from '../schemas';

const workshopItemSchema = z.object({
  id: z.number(),
  name: workshopNameSchema,
  altName: z.string().nullish(),
  categoriesRaw: z.array(z.string()).nullish(),
  cost: z.number().nullish(),
  currency: z.string().nullish(),
  weight: z.number().nullish(),
  description: z.string().nullish(),
  source: workshopSourceSchema,
});

/**
 * Снаряжение из справочника для редактора.
 * @param input - ответ сервера
 */
export function parseWorkshopItem(input: unknown): WorkshopItem {
  const item = workshopItemSchema.parse(input);

  return {
    id: item.id,
    name: item.name.rus,
    englishName: item.name.eng,
    altName: item.altName ?? '',
    categories: item.categoriesRaw ?? [],
    cost: item.cost ?? null,
    currency: item.currency ?? '',
    weight: item.weight ?? null,
    description: item.description ?? '',
    source: item.source?.shortName,
  };
}

/** Форма снаряжения: те же поля, что принимает бэкенд. */
export const itemFormSchema = z.object({
  name: workshopRequiredText,
  englishName: workshopRequiredText,
  altName: z.string(),
  categories: z.array(z.string()),
  cost: workshopOptionalNotNegative,
  currency: z.string().optional(),
  weight: workshopOptionalWeight,
  description: z.string(),
});

export type ItemForm = z.infer<typeof itemFormSchema>;
