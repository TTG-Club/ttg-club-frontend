import type { TName, TSource, TType } from '@/shared/types/BaseApiFields';

export enum ArmorsFilterDefaults {
  dbName = 'armors',
  url = '/filters/armors',
}

export interface ArmorItem {
  id: number;
  name: TName;
  type: TType;
  typeRaw: string;
  armorClass: string;
  armorClassRaw: number;
  price?: string;
  cost?: number;
  weight?: number;
  description?: string;
  disadvantage?: boolean;
  requirement?: number;
  duration?: string;
  source: TSource;
}

export interface ArmorSave {
  name: string;
  englishName: string;
  altName?: string;
  armorClass?: number;
  cost?: number;
  weight?: number;
  forceRequirements?: number;
  stealthHindrance?: boolean;
  type: string;
  description?: string;
  /** Аббревиатура книги-источника, например MM */
  source?: string;
}
