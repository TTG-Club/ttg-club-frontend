import type {
  AnyObject, RecordKey, WithProperty
} from '@/types/Shared/Utility.types';
import type { DefaultKeyField } from '@/common/const';

export type TListRow<
  Item = AnyObject,
  KeyField extends RecordKey = DefaultKeyField
> = WithProperty<KeyField, string> & {
  columns: Item[];
};

export type TGetListRowsOptions<Item, KeyField extends keyof Item> = {
  chunks: number;
  keyField: KeyField;
};
