import type { DefaultKeyField } from '@/shared/const';
import type {
  AnyObject,
  RecordKey,
  WithProperty,
} from '@/shared/types/Utility';

export type TListRow<
  Item = AnyObject,
  KeyField extends RecordKey = DefaultKeyField,
> = WithProperty<KeyField, string> & {
  columns: Item[];
};

export type TGetListRowsOptions<KeyField extends RecordKey> = {
  chunks: number;
  keyField: KeyField;
};
