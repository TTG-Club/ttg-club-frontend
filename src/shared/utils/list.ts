import { chunk } from 'lodash-es';

import { DEFAULT_ENTITY_KEY_FIELD } from '@/shared/const';
import type { TName } from '@/shared/types/BaseApiFields';
import type { TGetListRowsOptions, TListRow } from '@/shared/types/List';

export const getListRows = <Item, KeyField extends keyof Item>(
  items: Item[],
  { chunks, keyField }: TGetListRowsOptions<Item, KeyField>,
): TListRow<Item, KeyField>[] =>
  chunk(items, chunks).map(
    (columns) =>
      ({
        /* ID for row combined from columns ids */
        [keyField]: columns.map((column) => column[keyField]).join(''),
        columns,
      }) as TListRow<Item, KeyField>,
  );

export const createGetGroupByFirstLetter =
  (keyField: string = DEFAULT_ENTITY_KEY_FIELD) =>
  (item: { name: TName }) => {
    const [firstLetter] = item.name.rus;

    return {
      name: firstLetter,
      [keyField]: firstLetter,
    };
  };

export const getGroupByFirstLetter = createGetGroupByFirstLetter(
  DEFAULT_ENTITY_KEY_FIELD,
);

export const getGroupWithIdByFirstLetter = createGetGroupByFirstLetter('id');
