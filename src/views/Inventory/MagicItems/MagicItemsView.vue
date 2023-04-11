<template>
    <content-layout
        title="Магические предметы"
        :filter-instance="filter"
        :show-right-side="showRightSide"
        @search="onSearch"
        @update="initPages"
        @list-end="nextPage"
    >
        <dynamic-scroller
            :items="items"
            key-field="url"
            :min-item-size="55"
            page-mode
            class="scroller"
        >
            <template #default="{ item, index, active }">
                <dynamic-scroller-item
                    :key="item.url"
                    :item="item"
                    :data-index="index"
                    :active="active"
                    class="item"
                >
                    <magic-item-link
                        :magic-item="item"
                        :to="{ path: item.url }"
                    />
                </dynamic-scroller-item>
            </template>
        </dynamic-scroller>
    </content-layout>
</template>

<script>
    import {
        computed, defineComponent, onBeforeMount
    } from 'vue';
    import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
    import { storeToRefs } from 'pinia';
    import { useRoute, useRouter } from 'vue-router';
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import MagicItemLink from '@/views/Inventory/MagicItems/MagicItemLink.vue';
    import { useUIStore } from '@/store/UI/UIStore';
    import { useFilter } from '@/common/composition/useFilter';
    import { MagicItemsFilterDefaults } from '@/types/Inventory/MagicItems.types';
    import { usePagination } from '@/common/composition/usePagination';

    export default defineComponent({
        components: {
            MagicItemLink,
            ContentLayout,
            DynamicScroller,
            DynamicScrollerItem
        },
        setup() {
            const route = useRoute();
            const router = useRouter();
            const uiStore = useUIStore();

            const {
                isMobile,
                fullscreen
            } = storeToRefs(uiStore);

            const filter = useFilter({
                dbName: MagicItemsFilterDefaults.dbName,
                url: MagicItemsFilterDefaults.url
            });

            const {
                initPages,
                nextPage,
                items
            } = usePagination({
                url: '/items/magic',
                limit: 70,
                filter: {
                    isCustomized: filter.isCustomized,
                    value: filter.queryParams
                },
                search: filter.search,
                order: [
                    {
                        field: 'rarity',
                        direction: 'asc'
                    },
                    {
                        field: 'name',
                        direction: 'asc'
                    }
                ]
            });

            const onSearch = async () => {
                await initPages();

                if (items.value.length === 1 && !isMobile.value) {
                    await router.push({ path: items.value[0].url });
                }
            };

            onBeforeMount(async () => {
                await filter.initFilter();
                await initPages();

                if (!isMobile.value && items.value.length && route.name === 'magicItems') {
                    await router.push({ path: items.value[0].url });
                }
            });

            return {
                isMobile,
                fullscreen,
                items,
                filter,
                showRightSide: computed(() => route.name === 'magicItemDetail'),
                initPages,
                nextPage,
                onSearch
            };
        }
    });
</script>

<style lang="scss" scoped>
    .item {
        :global(.vue-recycle-scroller__item-view #{&})  {
            padding-bottom: 12px;
        }
    }
</style>
