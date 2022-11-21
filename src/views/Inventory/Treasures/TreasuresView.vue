<template>
    <content-layout
        :filter-instance="filter"
        @search="onSearch"
        @update="initPages"
        @list-end="nextPage"
    >
        <treasure-item
            v-for="(treasure, key) in treasures"
            :key="treasure.name.eng + key"
            :treasure="treasure"
        />
    </content-layout>
</template>

<script>
    import {
        computed, defineComponent, onBeforeMount
    } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { storeToRefs } from 'pinia';
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import TreasureItem from "@/views/Inventory/Treasures/TreasureItem.vue";
    import { useUIStore } from '@/store/UI/UIStore';
    import { useFilter } from '@/common/composition/useFilter';
    import { usePagination } from '@/common/composition/usePagination';
    import { TreasuresFilterDefaults } from '@/types/Inventory/Treasures.types';

    export default defineComponent({
        components: {
            TreasureItem,
            ContentLayout
        },
        setup() {
            const route = useRoute();
            const router = useRouter();
            const uiStore = useUIStore();
            const { isMobile, fullscreen } = storeToRefs(uiStore);

            const filter = useFilter({
                dbName: TreasuresFilterDefaults.dbName,
                url: TreasuresFilterDefaults.url
            });

            const {
                initPages, nextPage, items: treasures
            } = usePagination({
                url: '/treasures',
                limit: 70,
                filter: {
                    isCustomized: filter.isCustomized,
                    value: filter.queryParams
                },
                search: filter.search,
                order: [
                    {
                        field: 'cost',
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

                if (treasures.value.length === 1 && !isMobile.value) {
                    await router.push({ path: treasures.value[0].url });
                }
            };

            onBeforeMount(async () => {
                await filter.initFilter();
                await initPages();

                if (!isMobile.value && treasures.value.length && route.name === 'treasures') {
                    await router.push({ path: treasures.value[0].url });
                }
            });

            return {
                isMobile,
                fullscreen,
                treasures,
                filter,
                showRightSide: computed(() => route.name === 'treasureDetail'),
                initPages,
                nextPage,
                onSearch
            };
        }
    });
</script>
