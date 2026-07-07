import type { TName, TSource } from '@/shared/types/BaseApiFields';
import type { IRollTable } from '@/shared/types/RollTable';

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
  personalizationTables?: IRollTable[];
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
  language?: string;
  languages: string[];
}
