import type { TName, TSource } from '@/shared/types/BaseApiFields';

export enum GodsFilterDefaults {
  dbName = 'gods',
  url = '/filters/gods',
}

export type GodSex = 'MALE' | 'FEMALE' | 'PHILOSOPHY' | 'UNDEFINE';

export interface GodDetail {
  name: TName;
  alignment: string;
  shortAlignment: string;
  description?: string;
  rank?: string;
  titles?: string[];
  symbol?: string;
  domains?: string[];
  panteons?: string[];
  images?: string[];
  source?: TSource;
}

export interface GodSave {
  name: string;
  englishName: string;
  altName?: string;
  commitment?: string;
  sex: GodSex;
  rank: string;
  alignment: string;
  description?: string;
  alternativeDescription?: string;
  symbol?: string;
  nicknames?: string;
  domains: string[];
  pantheonId: number;
  source?: string;
  page?: number;
}

export interface GodEdit extends GodSave {
  id: number;
}
