<template>
    <virtual-list
        v-bind="list"
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
                :columns="columns"
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
    import GroupedListCategory from "@/components/list/GroupedList/components/GroupedListCategory.vue";
    import type { AnyObject } from "@/types/Shared/Utility.types";
    import type { ListIteratee } from "@/types/Shared/Lodash.types";
    import type { TGetGroup } from "@/components/list/GroupedList/types";
    import ListRow, { TListRowProps } from "@/components/list/ListRow.vue";
    import { getListItemsWithGroups } from "@/components/list/GroupedList/helpers";
    import { DEFAULT_KEY_FIELD } from "@/common/const";

    /* TODO: Добавить generic-типизацию по выходу Vue 3.3 */
    type TItem = AnyObject;
    type TGroup = AnyObject;

    type TProps = {
        list: TVirtualListProps;
        getGroup: TGetGroup<TItem, TGroup>;
        groupLabelKey?: string;
        sortBy?: ListIteratee;
        columns?: TListRowProps["columns"];
    };

    const props = withDefaults(defineProps<TProps>(), {
        groupLabelKey: "name",
        sortBy: "order",
        columns: 1
    });

    const keyField = props.list.keyField || DEFAULT_KEY_FIELD;

    const items = computed(() => {
        const allGroups = props.list.items.map((item: TItem) => props.getGroup(item));
        const allGroupsSet = uniqBy(allGroups, keyField);
        const sortedGroups = sortBy(allGroupsSet, props.sortBy);

        return getListItemsWithGroups(sortedGroups, props.list.items, {
            getGroup: props.getGroup,
            keyField,
            chunks: props.columns
        });
    });
</script>
