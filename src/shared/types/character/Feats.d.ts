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
  name: TName;
  requirements: string;
  description: string;
  source: TSource;
  homebrew?: boolean;
}
