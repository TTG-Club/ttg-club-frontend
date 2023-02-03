<template>
    <content-layout
        title="Боги"
        :filter-instance="filter"
        :show-right-side="showRightSide"
        @search="onSearch"
        @update="initPages"
        @list-end="nextPage"
    >
        <god-link
            v-for="god in gods"
            :key="god.url"
            :god="god"
            :to="{ path: god.url }"
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
    import GodLink from '@/views/Wiki/Gods/GodLink.vue';
    import { useUIStore } from '@/store/UI/UIStore';
    import { GodsFilterDefaults } from '@/types/Wiki/Gods.types';
    import { useFilter } from '@/common/composition/useFilter';
    import { usePagination } from '@/common/composition/usePagination';

    export default defineComponent({
        components: {
            GodLink,
            ContentLayout
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
                dbName: GodsFilterDefaults.dbName,
                url: GodsFilterDefaults.url
            });

            const {
                initPages,
                nextPage,
                items: gods
            } = usePagination({
                url: '/gods',
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

                if (gods.value.length === 1 && !isMobile.value) {
                    await router.push({ path: gods.value[0].url });
                }
            };

            onBeforeMount(async () => {
                await filter.initFilter();
                await initPages();

                if (!isMobile.value && gods.value.length && route.name === 'gods') {
                    await router.push({ path: gods.value[0].url });
                }
            });

            return {
                isMobile,
                fullscreen,
                gods,
                filter,
                showRightSide: computed(() => route.name === 'godDetail'),
                initPages,
                nextPage,
                onSearch
            };
        }
    });
</script>
