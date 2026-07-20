import type {
  TClassBadge,
  TName,
  TRaceBadge,
  TSource,
  TSubclassBadge,
} from '@/shared/types/BaseApiFields';

export enum SpellsFilterDefaults {
  dbName = 'spells',
  url = '/filters/spells',
}

export type TSpellLinkComponents = {
  v?: boolean;
  s?: boolean;
  m?: boolean;
};

export type TSpellItemComponents = {
  v?: boolean;
  s?: boolean;
  m?: string;
};

export type TSpellLink = {
  name: TName;
  level: number;
  school: string;
  additionalType?: string;
  components: TSpellLinkComponents;
  url: string;
  source: TSource;
  concentration?: boolean;
  ritual?: boolean;
};

export type TSpellItem = {
  id: number;
  name: TName;
  level: number;
  school: string;
  additionalType?: string;
  components: TSpellItemComponents;
  url: string;
  source: TSource;
  range: string;
  duration: string;
  time: string;
  classes: TClassBadge[];
  subclasses?: TSubclassBadge[];
  description: string;
  concentration?: boolean;
  ritual?: boolean;
  races?: TRaceBadge[];
  upper?: string;
};

export type TSpellSave = {
  name: string;
  englishName: string;
  level: number;
  school: string;
  additionalType?: string;
  ritual: boolean;
  concentration: boolean;
  verbalComponent: boolean;
  somaticComponent: boolean;
  consumable: boolean;
  materialComponent?: string;
  timeNumber: number;
  timeUnit: string;
  timeCondition?: string;
  range: string;
  duration: string;
  description: string;
  upper?: string;
  /** Аббревиатура книги-источника, например MM */
  source?: string;
};
