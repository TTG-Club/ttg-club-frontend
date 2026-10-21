import { z } from 'zod';

import { entryNameSchema, entrySourceSchema } from '~section/model';

/** Тип оружия, доспеха или драгоценности с порядком групп в списке. */
const inventoryTypeSchema = z.object({
  name: z.string(),
  order: z.number(),
});

const damageSchema = z.object({
  dice: z.string().nullish(),
  type: z.string().nullish(),
});

/* --- Оружие ------------------------------------------------------------- */

export const weaponLinkSchema = z.object({
  name: entryNameSchema,
  url: z.string().min(1),
  type: inventoryTypeSchema,
  damage: damageSchema.nullish(),
  price: z.string().nullish(),
  source: entrySourceSchema.nullish(),
});

export type WeaponLink = z.infer<typeof weaponLinkSchema>;

/** Свойство оружия со ссылкой на его описание в ширме. */
const weaponPropertySchema = z.object({
  name: z.string(),
  url: z.string().nullish(),
  twoHandDice: z.string().nullish(),
  distance: z.string().nullish(),
  description: z.string().nullish(),
});

export type WeaponProperty = z.infer<typeof weaponPropertySchema>;

export const weaponDetailSchema = weaponLinkSchema.omit({ url: true }).extend({
  weight: z.number().nullish(),
  properties: z.array(weaponPropertySchema).nullish(),
  description: z.string().nullish(),
  special: z.string().nullish(),
});

export type WeaponDetail = z.infer<typeof weaponDetailSchema>;

/* --- Доспехи ------------------------------------------------------------ */

export const armorLinkSchema = z.object({
  name: entryNameSchema,
  url: z.string().min(1),
  type: inventoryTypeSchema,
  armorClass: z.string().nullish(),
  price: z.string().nullish(),
  source: entrySourceSchema.nullish(),
});

export type ArmorLink = z.infer<typeof armorLinkSchema>;

export const armorDetailSchema = armorLinkSchema.omit({ url: true }).extend({
  weight: z.number().nullish(),
  disadvantage: z.boolean().nullish(),
  requirement: z.number().nullish(),
  duration: z.string().nullish(),
  description: z.string().nullish(),
});

export type ArmorDetail = z.infer<typeof armorDetailSchema>;

/* --- Снаряжение --------------------------------------------------------- */

export const itemLinkSchema = z.object({
  name: entryNameSchema,
  url: z.string().min(1),
  source: entrySourceSchema.nullish(),
});

export type ItemLink = z.infer<typeof itemLinkSchema>;

export const itemDetailSchema = itemLinkSchema.omit({ url: true }).extend({
  // Цена снаряжения приходит текстом («5 зм»), но схема API её не обещает
  price: z.union([z.string(), z.number()]).nullish(),
  weight: z.number().nullish(),
  categories: z.array(z.string()).nullish(),
  description: z.string().nullish(),
});

export type ItemDetail = z.infer<typeof itemDetailSchema>;

/* --- Магические предметы ------------------------------------------------ */

const raritySchema = z.object({
  type: z.string(),
  name: z.string(),
});

export type MagicItemRarity = z.infer<typeof raritySchema>;

export const magicItemLinkSchema = z.object({
  name: entryNameSchema,
  url: z.string().min(1),
  rarity: raritySchema,
  customization: z.boolean().nullish(),
  source: entrySourceSchema.nullish(),
});

export type MagicItemLink = z.infer<typeof magicItemLinkSchema>;

/** Уточнение типа предмета: конкретный доспех, оружие или особенность. */
const detailTypeSchema = z.object({
  name: z.string(),
  url: z.string().nullish(),
});

export const magicItemDetailSchema = magicItemLinkSchema
  .omit({ url: true })
  .extend({
    type: z.object({ name: z.string() }),
    detailType: z.array(detailTypeSchema).nullish(),
    detailCustamization: z.array(z.string()).nullish(),
    cost: z.object({ dmg: z.string(), xge: z.string() }).nullish(),
    images: z.array(z.string()).nullish(),
    description: z.string().nullish(),
  });

export type MagicItemDetail = z.infer<typeof magicItemDetailSchema>;

/* --- Драгоценности ------------------------------------------------------ */

export const treasureSchema = z.object({
  name: entryNameSchema,
  type: inventoryTypeSchema,
  price: z.number().nullish(),
  source: entrySourceSchema.nullish(),
});

export type Treasure = z.infer<typeof treasureSchema>;
