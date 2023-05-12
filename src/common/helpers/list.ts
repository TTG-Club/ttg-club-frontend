import chunk from 'lodash/chunk';
import type { TGetListRowsOptions, TListRow } from '@/types/Shared/List.types';
import type { TName } from '@/types/Shared/BaseApiFields.types';

export const getListRows = <Item, KeyField extends keyof Item>(
  items: Item[],
  {
    chunks,
    keyField
  }: TGetListRowsOptions<Item, KeyField>
): TListRow<Item, KeyField>[] => chunk(items, chunks)
    .map(columns => ({
    /* ID for row combined from columns ids */
      [keyField]: columns.map(column => column[keyField])
        .join(''),
      columns
    } as TListRow<Item, KeyField>));

export const getGroupByFirstLetter = <Item extends {name: TName}>(
  item: Item
) => {
  const [firstLetter] = item.name.rus;

  return {
    name: firstLetter,
    url: firstLetter
  };
};
