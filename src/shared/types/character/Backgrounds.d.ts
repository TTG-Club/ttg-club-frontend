import type { TName, TSource } from '@/shared/types/BaseApiFields';

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
  languages?: string[];
  equipments?: string[];
  startGold?: number;
  description?: string;
  personalization?: string;
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
  personalization?: string;
  language?: string;
  languages: string[];
}
