<template>
    <virtual-list
        :key-field="list.keyField"
        :page-mode="list.pageMode"
        :min-item-size="list.minItemSize"
        :items="items"
    >
        <template #default="{ item, index, active }">
            <slot
                v-if="item.isGroup"
                name="category"
                v-bind="{ item, index, active }"
            >
                <grouped-list-category>
                    {{ item[groupLabelKey] }}
                </grouped-list-category>
            </slot>

            <list-row
                v-else
                :row="item.columns"
                :columns="currentColumns"
                :item-key="itemKeyField"
            >
                <template #default="{ item: column }">
                    <slot v-bind="{ item: column, index, active }" />
                </template>
            </list-row>
        </template>
    </virtual-list>
</template>

<script setup lang="ts">
    import { computed } from "vue";
    import uniqBy from "lodash/uniqBy";
    import sortBy from "lodash/sortBy";
    import VirtualList, {
        TVirtualListProps
    } from "@/components/list/VirtualList.vue";
    import GroupedListCategory from "@/components/list/GroupedListCategory.vue";
    import type { AnyObject } from "@/types/Shared/Utility.types";
    import type { ListIteratee } from "@/types/Shared/Lodash.types";
    import type { TGetGroup } from "@/components/list/VirtualGroupedList/types";
    import ListRow, { TListRowProps } from "@/components/list/ListRow.vue";
    import { getListItemsWithGroups } from "@/components/list/VirtualGroupedList/helpers";
    import { DEFAULT_KEY_FIELD } from "@/common/const";
    import type { TBreakpoint } from "@/types/Shared/Breakpoints.types";
    import { useAppBreakpoints } from "@/common/composition/useAppBreakpoints";

    export type TResponsiveColumns = Partial<Record<TBreakpoint, number>> & {base: number};

    /* TODO: Добавить generic-типизацию по выходу Vue 3.3 */
    type TItem = AnyObject;
    type TGroup = AnyObject;

    type TProps = {
        list: TVirtualListProps;
        getGroup: TGetGroup<TItem, TGroup>;
        groupLabelKey?: string;
        sortBy?: ListIteratee;
        columns?: TResponsiveColumns;
    };

    const props = withDefaults(defineProps<TProps>(), {
        groupLabelKey: "name",
        sortBy: "order",
        columns: () => ({ base: 1 })
    });

    const breakpoints = useAppBreakpoints();
    const itemKeyField = computed(() => props.list.keyField || DEFAULT_KEY_FIELD);

    const currentColumns = computed(() => {
        const columnBreakpointKeys = Object.keys(props.columns)
            .filter(breakpoint => breakpoint !== 'base') as TBreakpoint[];

        const currentColumnBreakpoint = columnBreakpointKeys
            .find(breakpoint => breakpoints.smaller(breakpoint).value) ?? 'base';

        return props.columns[currentColumnBreakpoint] as number;
    });

    const items = computed(() => {
        const allGroups = props.list.items.map((item: TItem) => props.getGroup(item));
        const allGroupsSet = uniqBy(allGroups, itemKeyField.value);
        const sortedGroups = sortBy(allGroupsSet, props.sortBy);

        return getListItemsWithGroups(sortedGroups, props.list.items, {
            getGroup: props.getGroup,
            keyField: itemKeyField.value,
            chunks: currentColumns.value
        });
    });
</script>
