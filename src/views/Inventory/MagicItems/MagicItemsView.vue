<template>
    <content-layout
        title="Магические предметы"
        :filter-instance="filter"
        :show-right-side="showRightSide"
        @search="onSearch"
        @update="initPages"
        @list-end="nextPage"
    >
        <virtual-grid-list
            :list="{ items, keyField: 'url' }"
            :flat="showRightSide"
        >
            <template #default="{ item }">
                <magic-item-link
                    :magic-item="item"
                    :to="{ path: item.url }"
                />
            </template>
        </virtual-grid-list>
    </content-layout>
</template>

<script lang="ts" setup>
    import { storeToRefs } from 'pinia';
    import { computed, onBeforeMount } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import VirtualGridList from '@/components/list/VirtualGridList/VirtualGridList.vue';
    import { useFilter } from '@/common/composition/useFilter';
    import { usePagination } from '@/common/composition/usePagination';
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import { useUIStore } from '@/store/UI/UIStore';
    import { MagicItemsFilterDefaults } from '@/types/Inventory/MagicItems.types';
    import MagicItemLink from '@/views/Inventory/MagicItems/MagicItemLink.vue';

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

    const showRightSide = computed(() => route.name === 'magicItemDetail');
</script>
