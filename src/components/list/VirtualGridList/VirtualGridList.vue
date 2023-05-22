<template>
  <virtual-list
    v-bind="list"
    :items="items"
  >
    <template #default="{ item: row, index, active }">
      <slot
        name="row"
        v-bind="{ row, index, active }"
      >
        <list-row
          :columns="currentColumns"
          :item-key="itemKeyField"
          :row="row.columns"
        >
          <template #default="{ item }">
            <slot v-bind="{ item, index, active }" />
          </template>
        </list-row>
      </slot>
    </template>
  </virtual-list>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import clsx from "clsx";
  import VirtualList, { TVirtualListProps } from '@/components/list/VirtualList.vue';
  import type { AnyObject } from '@/types/Shared/Utility.types';
  import ListRow, { TListRowProps } from '@/components/list/ListRow.vue';
  import { DEFAULT_KEY_FIELD } from '@/common/const';
  import type { TResponsiveValues } from '@/common/composition/useResponsiveValues';
  import { useResponsiveValues } from '@/common/composition/useResponsiveValues';
  import { getListRows } from '@/common/helpers/list';
  import type { TListRow } from '@/types/Shared/List.types';

  /* TODO: Добавить generic-типизацию по выходу Vue 3.3 */
  type TItem = AnyObject;

  export type TVirtualGridListContext = {
    columns: number;
    keyField: TVirtualListProps['keyField']
  };

  export type TVirtualGridListProps = Omit<TProps, 'list'>;

  interface TProps {
    list: TVirtualListProps;
    columns?: TResponsiveValues<number>;
    flat?: boolean;
    getRows?: (items: TItem[], context: TVirtualGridListContext) => TListRow<TItem, typeof props.list.keyField>[];
  }

  const props = withDefaults(defineProps<TProps>(), {
    columns: () => ({
      md: 1,
      xl: 2,
      base: 3
    }),
    flat: false,
    getRows: undefined
  });

  const itemKeyField = computed(() => props.list.keyField || DEFAULT_KEY_FIELD);
  const columnConfig = computed(() => (props.flat ? { base: 1 } : props.columns));

  const { current: currentColumns } = useResponsiveValues({ values: columnConfig });

  const list = computed<TVirtualListProps>(() => ({
    ...props.list,
    getItemClass: (item: TItem) => clsx(props.list.getItemClass?.(item), "virtual-grid-list__item")
  }));

  const items = computed(() => (props.getRows
    ? props.getRows(props.list.items, {
      columns: currentColumns.value,
      keyField: itemKeyField.value
    })
    : getListRows<TItem, keyof TItem>(props.list.items, {
      chunks: currentColumns.value,
      keyField: itemKeyField.value
    })));
</script>

<style lang="scss" scoped>
  :deep {
    .vue-recycle-scroller__item-view {
      margin: 0;
      padding: 0;

      > .virtual-grid-list__item {
        padding-bottom: 0;
      }
    }
  }
</style>
