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
    import VirtualList, {
        TVirtualListProps
    } from "@/components/list/VirtualList.vue";
    import type { AnyObject } from "@/types/Shared/Utility.types";
    import ListRow, { TListRowProps } from "@/components/list/ListRow.vue";
    import { DEFAULT_KEY_FIELD } from "@/common/const";
    import type { TResponsiveValues } from "@/common/composition/useResponsiveValues";
    import { useResponsiveValues } from "@/common/composition/useResponsiveValues";
    import { getListRows } from "@/common/helpers/list";

    /* TODO: Добавить generic-типизацию по выходу Vue 3.3 */
    type TItem = AnyObject;

    type TProps = {
        list: TVirtualListProps;
        columns?: TResponsiveValues<number>;
    };

    const props = withDefaults(defineProps<TProps>(), {
        columns: () => ({ base: 1 })
    });

    const itemKeyField = computed(() => props.list.keyField || DEFAULT_KEY_FIELD);

    const { current } = useResponsiveValues({ values: props.columns });

    const items = computed(() => getListRows<TItem, keyof TItem>(props.list.items, {
        chunks: current.value,
        keyField: itemKeyField.value
    }));
</script>
