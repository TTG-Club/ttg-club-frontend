export type TNameValue<T = string> = {
  name: string;
  value: T;
};

export type TName = {
  rus: string;
  eng: string;
};

export type TSource = {
  shortName: string;
  name: string;
  homebrew?: boolean;
  page?: number;
};

export type TClassBadge = {
  name: string;
  url: string;
  icon: string;
};

export type TSubclassBadge = {
  name: string;
  url: string;
  class: string;
};

export type TRaceBadge = {
  name: string;
  url: string;
};

export type TPrice = {
  dmg: string;
  xge: string;
};

export type TType = {
  name: string;
  order: number;
};

export interface IAbilitiesValue {
  str: number;
  dex: number;
  con: number;
  int: number;
  wiz: number;
  cha: number;
}

export interface IOrderItem {
  field: string;
  direction: string;
}

export interface IPaginatedResponse<T> {
  items: Array<T>;
  total: number;
  page?: number;
  size?: number;
  pages?: number;
}
