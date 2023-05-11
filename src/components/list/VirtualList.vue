<template>
    <dynamic-scroller
        v-bind="props"
        list-tag="ul"
        item-tag="li"
    >
        <template #default="{ item, index, active }">
            <dynamic-scroller-item
                :key="item[keyField]"
                :item="item"
                :data-index="index"
                :active="active"
                class="item"
            >
                <slot v-bind="{ item, index, active }" />
            </dynamic-scroller-item>
        </template>
    </dynamic-scroller>
</template>

<script setup lang="ts">
    import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
    import { DEFAULT_KEY_FIELD } from "@/common/const";

    /* TODO: Добавить generic-типизацию по выходу Vue 3.3 */

    export type TVirtualListProps = {
        items: unknown[];
        keyField?: string,
        minItemSize?: number;
        pageMode?: boolean;
    };

    const props = withDefaults(defineProps<TVirtualListProps>(), {
        keyField: DEFAULT_KEY_FIELD,
        pageMode: true,
        minItemSize: 55
    });
</script>

<style lang="scss" scoped>
    $item-spacing: 12px;

    :deep {
        &.vue-recycle-scroller {
            margin-bottom: -$item-spacing;
        }

        .vue-recycle-scroller__item-wrapper {
            padding: 0;
            margin: 0;
        }

        .vue-recycle-scroller__item-view  {
            margin: 0;
            padding: 0;

            > .item {
                padding-bottom: $item-spacing;
            }
        }
    }
</style>
