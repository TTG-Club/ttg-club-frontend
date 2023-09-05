<template>
  <virtual-grid-list
    class="virtual-grouped-list"
    :get-rows="getRows"
    :list="listProps"
    v-bind="grid"
  >
    <template #row="rowProps">
      <slot
        v-if="rowProps.row.isGroup"
        name="group"
        v-bind="rowProps"
      >
        <grouped-list-category>
          {{ rowProps.row[groupLabelKey] }}
        </grouped-list-category>
      </slot>

      <slot
        name="row"
        v-bind="rowProps"
      />
    </template>

    <template #default="slotProps">
      <slot v-bind="slotProps" />
    </template>
  </virtual-grid-list>
</template>

<script lang="ts" setup>
  import clsx from 'clsx';
  import _sortBy from 'lodash/sortBy';
  import uniqBy from 'lodash/uniqBy';
  import { computed } from 'vue';

  import type { ListIteratee } from '@/shared/types/Lodash';
  import type { AnyObject } from '@/shared/types/Utility';

  import GroupedListCategory from '@/components/list/GroupedListCategory.vue';
  import type {
    TVirtualGridListBaseProps,
    TVirtualGridListContext
  } from '@/components/list/VirtualGridList/types';
  import VirtualGridList from '@/components/list/VirtualGridList/VirtualGridList.vue';
  import { getListItemsWithGroups } from '@/components/list/VirtualGroupedList/helpers';
  import type { TGetGroup } from '@/components/list/VirtualGroupedList/types';
  import type { TVirtualListProps } from '@/components/list/VirtualList/types';

  /* TODO: Добавить generic-типизацию по выходу Vue 3.3 */
  type TItem = AnyObject;
  type TGroup = AnyObject;

  type TProps = {
    list: TVirtualListProps;
    getGroup: TGetGroup<TItem, TGroup>;
    groupLabelKey?: string;
    sortBy?: ListIteratee;
    grid?: TVirtualGridListBaseProps;
  };

  const props = withDefaults(defineProps<TProps>(), {
    groupLabelKey: 'name',
    sortBy: 'order',
    grid: () => ({})
  });

  const listProps = computed<TVirtualListProps>(() => ({
    ...props.list,

    /* TODO: Типизировать через дженерики и убрать any */
    getItemClass: (item: any) =>
      clsx(props.list.getItemClass?.(item), {
        'virtual-grouped-list__group': item.isGroup
      })
  }));

  const getRows: TVirtualGridListBaseProps['getRows'] = (
    items: TItem[],
    context: TVirtualGridListContext
  ) => {
    const { keyField, columns } = context;

    const allGroups = items.map((item: TItem) => props.getGroup(item));
    const allGroupsSet = uniqBy(allGroups, keyField);
    const sortedGroups = _sortBy(allGroupsSet, props.sortBy);

    return getListItemsWithGroups(sortedGroups, items, {
      getGroup: props.getGroup,
      keyField,
      chunks: columns
    });
  };
</script>

<style lang="scss" scoped>
  .virtual-grouped-list :deep {
    --group-spacing: calc(var(--item-spacing) * 2);
    // Добавляем отрицательный margin для родителя, чтобы не было лишнего отступа
    margin-top: calc(-1 * var(--group-spacing));

    .vue-recycle-scroller__item-view {
      > .virtual-grouped-list__group {
        padding-top: var(--group-spacing);
        padding-bottom: var(--item-spacing);
      }
    }
  }
</style>
