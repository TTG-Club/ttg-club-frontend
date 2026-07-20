import type { TName, TSource, TType } from '@/shared/types/BaseApiFields';

export enum BooksFilterDefaults {
  dbName = 'books',
  url = '/filters/books',
}

export interface IBookLink {
  name: TName;
  url: string;
  type: TType;
  year?: number;
  source: TSource;
}
