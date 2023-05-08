<template>
    <virtual-list
        :key-field="list.keyField"
        :page-mode="list.pageMode"
        :min-item-size="list.minItemSize"
        :items="items"
    >
        <template #default="{ item: row, index, active }">
            <slot
                name="row"
                v-bind="{ row, index, active }"
            >
                <list-row
                    :row="row.columns"
                    :columns="currentColumns"
                    :item-key="itemKeyField"
                >
                    <template #default="{ item }">
                        <slot v-bind="{ item, index, active }" />
                    </template>
                </list-row>
            </slot>
        </template>
    </virtual-list>
</template>

<script setup lang="ts">
    import { computed } from "vue";
    import VirtualList, { TVirtualListProps } from "@/components/list/VirtualList.vue";
    import type { AnyObject } from "@/types/Shared/Utility.types";
    import ListRow, { TListRowProps } from "@/components/list/ListRow.vue";
    import { DEFAULT_KEY_FIELD } from "@/common/const";
    import type { TResponsiveValues } from "@/common/composition/useResponsiveValues";
    import { useResponsiveValues } from "@/common/composition/useResponsiveValues";
    import { getListRows } from "@/common/helpers/list";
    import type { TListRow } from "@/types/Shared/List.types";

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
            base: 4
        }),
        flat: false,
        getRows: undefined
    });

    const itemKeyField = computed(() => props.list.keyField || DEFAULT_KEY_FIELD);
    const columnConfig = computed(() => (props.flat ? { base: 1 } : props.columns));

    const { current: currentColumns } = useResponsiveValues({ values: columnConfig });

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
