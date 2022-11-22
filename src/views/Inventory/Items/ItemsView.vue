<template>
    <content-layout
        :filter-instance="filter"
        :show-right-side="showRightSide"
        @search="onSearch"
        @update="initPages"
        @list-end="nextPage"
    >
        <item-link
            v-for="item in items"
            :key="item.url"
            :item="item"
            :to="{ path: item.url }"
        />
    </content-layout>
</template>

<script>
    import {
        computed, defineComponent, onBeforeMount
    } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useRoute, useRouter } from 'vue-router';
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import ItemLink from "@/views/Inventory/Items/ItemLink.vue";
    import { useUIStore } from "@/store/UI/UIStore";
    import { useFilter } from '@/common/composition/useFilter';
    import { ItemsFilterDefaults } from '@/types/Inventory/Items.types';
    import { usePagination } from '@/common/composition/usePagination';

    export default defineComponent({
        components: {
            ItemLink,
            ContentLayout
        },
        setup() {
            const route = useRoute();
            const router = useRouter();
            const uiStore = useUIStore();
            const { isMobile, fullscreen } = storeToRefs(uiStore);

            const filter = useFilter({
                dbName: ItemsFilterDefaults.dbName,
                url: ItemsFilterDefaults.url
            });

            const {
                initPages, nextPage, items
            } = usePagination({
                url: '/items',
                limit: 70,
                filter: {
                    isCustomized: filter.isCustomized,
                    value: filter.queryParams
                },
                search: filter.search,
                order: [
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

                if (!isMobile.value && items.value.length && route.name === 'items') {
                    await router.push({ path: items.value[0].url });
                }
            });

            return {
                isMobile,
                fullscreen,
                items,
                filter,
                showRightSide: computed(() => route.name === 'itemDetail'),
                initPages,
                nextPage,
                onSearch
            };
        }
    });
</script>
