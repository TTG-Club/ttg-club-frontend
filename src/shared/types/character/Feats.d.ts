import type { TName, TSource } from '@/shared/types/BaseApiFields';

export enum FeatsFilterDefaults {
  dbName = 'feats',
  url = '/filters/feats',
}

export interface FeatsLinkItem {
  name: TName;
  url: string;
  requirements: string;
  homebrew?: boolean;
}

export interface FeatsItem {
  id: number;
  name: TName;
  requirements: string;
  description: string;
  source: TSource;
  abilities?: string[];
  skills?: string[];
  homebrew?: boolean;
}

export interface FeatSave {
  name: string;
  englishName: string;
  altName?: string;
  level?: number;
  requirement?: string;
  description: string;
  abilities: string[];
  skills: string[];
}
