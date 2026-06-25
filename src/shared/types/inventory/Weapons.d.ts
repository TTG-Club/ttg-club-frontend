import type { TName, TSource, TType } from '@/shared/types/BaseApiFields';

export enum WeaponsFilterDefaults {
  dbName = 'weapons',
  url = '/filters/weapons',
}

export interface WeaponProperty {
  name: string;
  url?: string;
  twoHandDice?: string;
  distance?: string;
  description?: string;
}

export interface WeaponItem {
  id: number;
  name: TName;
  type: TType;
  typeRaw: string;
  damage: {
    dice?: string;
    type: string;
  };
  damageDice?: string;
  twoHandDamageDice?: string;
  numberDice?: number;
  damageType: string;
  price?: string;
  cost?: number;
  currency?: string;
  weight?: number;
  minDistance?: number;
  maxDistance?: number;
  ammo?: number;
  description?: string;
  special?: string;
  properties?: WeaponProperty[];
  propertyIds?: number[];
  source: TSource;
}

export interface WeaponSave {
  name: string;
  englishName: string;
  altName?: string;
  cost?: number;
  currency?: string;
  weight?: number;
  damageDice?: string;
  twoHandDamageDice?: string;
  numberDice?: number;
  damageType: string;
  type: string;
  minDistance?: number;
  maxDistance?: number;
  properties: number[];
  ammo?: number;
  description?: string;
  special?: string;
}
