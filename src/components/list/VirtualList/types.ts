import type { AnyObject, Maybe } from '@/types/Shared/Utility.types';

export type TVirtualListProps = {
  items: AnyObject[];
  keyField?: string,
  minItemSize?: number;
  pageMode?: boolean;
  getItemClass?: (item: unknown) => Maybe<string>;
};
