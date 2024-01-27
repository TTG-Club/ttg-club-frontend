<template>
  <virtual-list
    :ref="reference"
    v-bind="listProps"
    :items="items"
    class="virtual-grid-list"
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
  import clsx from 'clsx';
  import { omit } from 'lodash-es';
  import { computed } from 'vue';

  import { useResponsiveValues } from '@/shared/composables/useResponsiveValues';
  import { DEFAULT_KEY_FIELD } from '@/shared/constants';
  import type { AnyObject } from '@/shared/types/Utility';
  import ListRow from '@/shared/ui/virtual-views/ListRow.vue';
  import type { TVirtualGridListProps } from '@/shared/ui/virtual-views/VirtualGridList/types';
  import type { TVirtualListProps } from '@/shared/ui/virtual-views/VirtualList/types';
  import VirtualList from '@/shared/ui/virtual-views/VirtualList/VirtualList.vue';
  import { getListRows } from '@/shared/utils/list';

  /* TODO: Добавить generic-типизацию по выходу Vue 3.3 */
  type TItem = AnyObject;

  const props = withDefaults(defineProps<TVirtualGridListProps>(), {
    columns: () => ({
      md: 1,
      xl: 2,
      base: 3
    }),
    flat: false,
    getRows: undefined,
    reference: undefined
  });

  const itemKeyField = computed(() => props.list.keyField || DEFAULT_KEY_FIELD);

  const columnConfig = computed(() =>
    props.flat ? { base: 1 } : props.columns
  );

  const { current: currentColumns } = useResponsiveValues({
    values: columnConfig
  });

  const listProps = computed<TVirtualListProps>(() => ({
    ...omit(props.list, 'reference'),
    getItemClass: item =>
      clsx(props.list.getItemClass?.(item), 'virtual-grid-list__item'),

    // Ищем в колонках, т.к. именно в них содержаться элементы
    getItemIndexByKey: (rows, key) =>
      rows.findIndex(
        row => row.columns?.find(item => item[itemKeyField.value] === key)
      )
  }));

  const items = computed(() =>
    props.getRows
      ? props.getRows(props.list.items, {
          columns: currentColumns.value,
          keyField: itemKeyField.value
        })
      : getListRows<TItem, keyof TItem>(props.list.items, {
          chunks: currentColumns.value,
          keyField: itemKeyField.value
        })
  );
</script>

<style lang="scss">
  .virtual-grid-list {
    .vue-recycle-scroller__item-view {
      margin: 0;
      padding: 0;

      > .virtual-grid-list__item {
        padding-bottom: 0;
      }
    }
  }
</style>
