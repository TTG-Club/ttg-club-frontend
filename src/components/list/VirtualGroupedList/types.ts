import type { DefaultKeyField } from '@/shared/const';
import type { TGetListRowsOptions, TListRow } from '@/shared/types/List';
import type { AnyObject, RecordKey } from '@/shared/types/Utility';

export type TGroupedListGroup<Group = AnyObject> = Group & {
  isGroup: boolean;
};

export type TGroupedListItem<
  Item,
  Group,
  KeyField extends RecordKey = DefaultKeyField
> = TListRow<Item, KeyField> | TGroupedListGroup<Group>;

export type TGetGroup<Item, Group> = (item: Item) => Group;

export type TFilterItemsByGroupIdOptions<Item, Group, KeyField> = {
  getGroup: TGetGroup<Item, Group>;
  keyField: KeyField;
};

export type TGetGroupedListItemsOptions<
  Item,
  Group,
  KeyField extends keyof Item
> = TFilterItemsByGroupIdOptions<Item, Group, KeyField> &
  TGetListRowsOptions<Item, KeyField>;
