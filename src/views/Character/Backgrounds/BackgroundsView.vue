<template>
    <content-layout
        title="Предыстории"
        :filter-instance="filter"
        :show-right-side="showRightSide"
        @search="onSearch"
        @update="initPages"
    >
        <virtual-grid-list
            :list="{ items: backgrounds, keyField: 'url', minItemSize: 50 }"
            :flat="showRightSide"
        >
            <template #default="{ item: background }">
                <background-link
                    :background-item="background"
                    :to="{ path: background.url }"
                />
            </template>
        </virtual-grid-list>
    </content-layout>
</template>

<script lang="ts" setup>
    import { computed, onBeforeMount } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useRoute, useRouter } from 'vue-router';
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import BackgroundLink from '@/views/Character/Backgrounds/BackgroundLink.vue';
    import { useUIStore } from '@/store/UI/UIStore';
    import { useFilter } from '@/common/composition/useFilter';
    import { usePagination } from '@/common/composition/usePagination';
    import { BackgroundsFilterDefaults } from '@/types/Character/Backgrounds.types';
    import VirtualGridList from "@/components/list/VirtualGridList/VirtualGridList.vue";

    const route = useRoute();
    const router = useRouter();
    const uiStore = useUIStore();

    const {
        isMobile,
        fullscreen
    } = storeToRefs(uiStore);

    const filter = useFilter({
        dbName: BackgroundsFilterDefaults.dbName,
        url: BackgroundsFilterDefaults.url
    });

    const {
        initPages,
        items: backgrounds
    } = usePagination({
        url: '/backgrounds',
        limit: -1,
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

        if (backgrounds.value.length === 1 && !isMobile.value) {
            await router.push({ path: backgrounds.value[0].url });
        }
    };

    onBeforeMount(async () => {
        await filter.initFilter();
        await initPages();

        if (!isMobile.value && backgrounds.value.length && route.name === 'backgrounds') {
            await router.push({ path: backgrounds.value[0].url });
        }
    });

    const showRightSide = computed(() => route.name === 'backgroundDetail');
</script>
