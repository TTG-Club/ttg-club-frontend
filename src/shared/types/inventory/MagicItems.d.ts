import type {
  TName,
  TPrice,
  TSource,
  TType,
} from '@/shared/types/BaseApiFields';

export enum MagicItemsFilterDefaults {
  dbName = 'magicItems',
  url = '/filters/items/magic',
}

export type TArtifactLink = {
  name: TName;
  url: string;
  type: TType;
  source: TSource;
  rarity: TArtifactRarity;
  homebrew?: boolean;
  customization?: boolean;
};

export type TArtifactRarityEnum =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'very-rare'
  | 'legendary'
  | 'artifact'
  | 'unknown'
  | 'varies';

export type TArtifactRarityShortEnum = 'O' | 'Н' | 'Р' | 'OР' | 'Л' | 'А' | '~';

export type TArtifactRarity = {
  type: TArtifactRarityEnum;
  name: string;
  short: TArtifactRarityShortEnum;
};

export type TArtifactItem = {
  name: TName;
  type: TType;
  source: TSource;
  rarity: TArtifactRarity;
  description: string;
  customization?: boolean;
  detailCustamization?: string[];
  cost?: TPrice;
  images?: string[];
  detailType?: string[];
  homebrew?: boolean;
};
