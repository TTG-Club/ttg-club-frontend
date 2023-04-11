<template>
    <dynamic-scroller
        v-bind="props"
        list-tag="ul"
        item-tag="li"
    >
        <template #default="{ item, index, active }">
            <dynamic-scroller-item
                :key="item.url"
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

    type TProps = {
        items: unknown[];
        keyField?: string,
        minItemSize?: number;
        pageMode?: boolean;
    };

    const props = withDefaults(defineProps<TProps>(), {
        keyField: 'url',
        pageMode: true,
        minItemSize: 55
    });
</script>

<style lang="scss" scoped>
    :deep(.vue-recycle-scroller__item-view)  {
        margin: 0;
        padding: 0;

        > .item {
            padding-bottom: 12px;
        }
    }
</style>
