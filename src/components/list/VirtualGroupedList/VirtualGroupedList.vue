<template>
  <virtual-grid-list
    class="virtual-grouped-list"
    :get-rows="getRows"
    :list="list"
    v-bind="grid"
  >
    <template
      #row="rowProps"
    >
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
  import uniqBy from 'lodash/uniqBy';
  import sortBy from 'lodash/sortBy';
  import { computed } from "vue";
  import clsx from "clsx";
  import { TVirtualListProps } from '@/components/list/VirtualList.vue';
  import GroupedListCategory from '@/components/list/GroupedListCategory.vue';
  import type { AnyObject } from '@/types/Shared/Utility.types';
  import type { ListIteratee } from '@/types/Shared/Lodash.types';
  import type { TGetGroup } from '@/components/list/VirtualGroupedList/types';
  import { TListRowProps } from '@/components/list/ListRow.vue';
  import { getListItemsWithGroups } from '@/components/list/VirtualGroupedList/helpers';
  import type {
    TVirtualGridListContext,
    TVirtualGridListProps
  } from '@/components/list/VirtualGridList/VirtualGridList.vue';
  import VirtualGridList from '@/components/list/VirtualGridList/VirtualGridList.vue';

  /* TODO: Добавить generic-типизацию по выходу Vue 3.3 */
  type TItem = AnyObject;
  type TGroup = AnyObject;

  type TProps = {
    list: TVirtualListProps;
    getGroup: TGetGroup<TItem, TGroup>;
    groupLabelKey?: string;
    sortBy?: ListIteratee;
    grid?: TVirtualGridListProps;
  };

  const props = withDefaults(defineProps<TProps>(), {
    groupLabelKey: "name",
    sortBy: "order",
    grid: () => ({})
  });

  const list = computed<TVirtualListProps>(() => ({
    ...props.list,
    getItemClass: (item: TItem) => clsx(props.list.getItemClass?.(item), {
      "virtual-grouped-list__group": item.isGroup
    })
  }));

  const getRows: TVirtualGridListProps['getRows'] = (items: TItem[], context: TVirtualGridListContext) => {
    const {
      keyField,
      columns
    } = context;

    const allGroups = items.map((item: TItem) => props.getGroup(item));
    const allGroupsSet = uniqBy(allGroups, keyField);
    const sortedGroups = sortBy(allGroupsSet, props.sortBy);

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
