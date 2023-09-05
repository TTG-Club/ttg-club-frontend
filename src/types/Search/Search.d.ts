export type TSearchResultSource = {
  name: string;
  shortName: string;
  homebrew?: boolean;
};

export type TSearchResult = {
  name: string;
  section: string;
  description?: string;
  url: string;
  source?: TSearchResultSource;
};

export type TSearchResultList = {
  count: number;
  list: TSearchResult[];
};
