import type { TName, TSource } from '@/shared/types/BaseApiFields';

export enum ScreensFilterDefaults {
  dbName = 'screens',
  url = '/filters/screens',
}

export interface IScreenGroupLink {
  name: TName;
  url: string;
  order: number;
  source: TSource;
  group?: string;
}

export interface IScreenLink {
  name: TName;
  url: string;
  order: number;
  source: TSource;
  icon: string;
  group: string;
}

export interface IScreenGroup {
  name: TName;
  url: string;
  order: number;
  chields: IScreenLink[];
}

export interface IScreenLinkParent {
  id: number;
  name: TName;
  url: string;
  order: number;
}

export interface IScreenItem {
  name: TName;
  url: string;
  order: number;
  source: TSource;
  description: string;
  parent?: IScreenLinkParent;
}

export interface IScreenDetail {
  id: number;
  name: TName;
  altName?: string;
  category?: string;
  description?: string;
  icon?: string;
  order: number;
  source?: TSource;
  parent?: IScreenLinkParent;
  chields?: IScreenLink[];
}

export interface IScreenSave {
  name: string;
  englishName: string;
  altName?: string;
  category?: string;
  description?: string;
  icon?: string;
  order?: number;
  source?: string;
  parentId?: number;
}
