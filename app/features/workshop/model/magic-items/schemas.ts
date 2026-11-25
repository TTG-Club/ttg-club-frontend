import type { WorkshopMagicItem } from './types';

import { z } from 'zod';

import { markupBlocksSchema } from '~content/model';

import { getCatalogSlugs } from '../catalog-picker';
import { WORKSHOP_VALIDATION } from '../constants';
import {
  magicItemMechanicsFormSchema,
  parseMagicItemMechanicsForm,
} from '../mechanics';
import {
  workshopNameSchema,
  workshopOptionalNotNegative,
  workshopOptionalPositive,
  workshopRequiredMarkup,
  workshopRequiredText,
  workshopSourceSchema,
} from '../schemas';
import { MAGIC_ITEM_BASE_SECTIONS } from './constants';

const workshopMagicItemSchema = z.object({
  id: z.number(),
  name: workshopNameSchema,
  altName: z.string().nullish(),
  rarityRaw: z.string().nullish(),
  typeRaw: z.string().nullish(),
  special: markupBlocksSchema.nullish(),
  detailType: z.array(z.object({ url: z.string().nullish() })).nullish(),
  customization: z.boolean().nullish(),
  custSpecial: markupBlocksSchema.nullish(),
  consumed: z.boolean().nullish(),
  curse: z.boolean().nullish(),
  charge: z.number().nullish(),
  costRaw: z.number().nullish(),
  bonus: z.number().nullish(),
  description: markupBlocksSchema.nullish(),
  mechanics: z.unknown().optional(),
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
    special: item.special ?? [],
    weapons: getCatalogSlugs(
      item.detailType,
      MAGIC_ITEM_BASE_SECTIONS.weapons.path,
    ),
    armors: getCatalogSlugs(
      item.detailType,
      MAGIC_ITEM_BASE_SECTIONS.armors.path,
    ),
    customization: !!item.customization,
    custSpecial: item.custSpecial ?? [],
    consumed: !!item.consumed,
    curse: !!item.curse,
    charge: item.charge ?? null,
    cost: item.costRaw ?? null,
    bonus: item.bonus ?? null,
    description: item.description ?? [],
    mechanics: parseMagicItemMechanicsForm(item.mechanics),
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
  special: markupBlocksSchema,
  weapons: z.array(z.string()),
  armors: z.array(z.string()),
  customization: z.boolean(),
  custSpecial: markupBlocksSchema,
  consumed: z.boolean(),
  curse: z.boolean(),
  charge: workshopOptionalPositive,
  cost: workshopOptionalNotNegative,
  bonus: workshopOptionalPositive,
  description: workshopRequiredMarkup,
  mechanics: magicItemMechanicsFormSchema,
});

export type MagicItemForm = z.infer<typeof magicItemFormSchema>;
