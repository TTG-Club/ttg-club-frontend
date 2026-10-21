import type { TName, TSource } from '@/shared/types/BaseApiFields';
import type { IRollTable } from '@/shared/types/RollTable';

export type BackgroundPersonalizationType =
  | 'LIFE_IN_SECLUSION'
  | 'EMPLOYMENT'
  | 'SPECIALIZATION'
  | 'ADOPTED_CULTURE'
  | 'VALUABLE_ITEMS'
  | 'SCAM'
  | 'AMPLOIS'
  | 'DEFINING_EVENT'
  | 'TRAIT'
  | 'IDEAL'
  | 'AFFECTION'
  | 'WEAKNESS'
  | 'WHY_ARE_YOU_HERE'
  | 'WHERE_ARE_YOU_FROM'
  | 'HERITAGE'
  | 'DISFIGURED'
  | 'CREED'
  | 'BAUBLE';

export interface BackgroundPersonalizationTable extends IRollTable {
  type: BackgroundPersonalizationType;
}

export interface BackgroundPersonalizationTableSave {
  type: BackgroundPersonalizationType;
  values: string[];
}

export enum BackgroundsFilterDefaults {
  dbName = 'backgrounds',
  url = '/filters/backgrounds',
}

export interface BackgroundItem {
  id: number;
  name: TName;
  url?: string;
  source: TSource;
  homebrew?: boolean;
  skills?: string[];
  toolOwnership?: string;
  language?: string;
  languages?: string[];
  equipments?: string[];
  startGold?: number;
  description?: string;
  skillName?: string;
  skillDescription?: string;
  personalization?: string;
  personalizationTables?: BackgroundPersonalizationTable[];
}

export interface BackgroundSave {
  name: string;
  englishName: string;
  altName?: string;
  skills: string[];
  otherSkills?: string;
  toolOwnership?: string;
  equipments?: string;
  startGold?: number;
  description: string;
  skillName?: string;
  skillDescription?: string;
  personalization?: string;
  personalizationTables: BackgroundPersonalizationTableSave[];
  language?: string;
  languages: string[];
  /** Аббревиатура книги-источника, например MM */
  source?: string;
}
