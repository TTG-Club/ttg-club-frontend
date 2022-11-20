<template>
    <content-layout
        :filter-instance="filter"
        :show-right-side="showRightSide"
        @search="onSearch"
        @update="initPages"
    >
        <background-link
            v-for="background in backgrounds"
            :key="background.url"
            :background-item="background"
            :to="{ path: background.url }"
        />
    </content-layout>
</template>

<script lang="ts">
    import {
        computed, defineComponent, onBeforeMount
    } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useRoute, useRouter } from 'vue-router';
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import BackgroundLink from "@/views/Character/Backgrounds/BackgroundLink.vue";
    import { useUIStore } from "@/store/UI/UIStore";
    import { useFilter } from '@/common/composition/useFilter';
    import usePagination from '@/common/composition/usePagination';
    import { BackgroundsFilterDefaults } from '@/types/Backgrounds.types';

    export default defineComponent({
        components: {
            BackgroundLink,
            ContentLayout
        },
        setup() {
            const route = useRoute();
            const router = useRouter();
            const uiStore = useUIStore();
            const { isMobile, fullscreen } = storeToRefs(uiStore);

            const filter = useFilter({
                dbName: BackgroundsFilterDefaults.dbName,
                url: BackgroundsFilterDefaults.url
            });

            const { initPages, items: backgrounds } = usePagination({
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

            return {
                isMobile,
                fullscreen,
                backgrounds,
                filter,
                showRightSide: computed(() => route.name === 'backgroundDetail'),
                initPages,
                onSearch
            };
        }
    });
</script>
