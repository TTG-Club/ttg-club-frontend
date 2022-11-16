<template>
    <content-layout
        :filter-instance="filter"
        :show-right-side="showRightSide"
        @search="onSearch"
        @update="initPages"
        @list-end="nextPage"
    >
        <creature-link
            v-for="creature in bestiary"
            :key="creature.url"
            :creature="creature"
            :to="{ path: creature.url }"
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
    import { useBestiaryStore } from "@/store/Bestiary/BestiaryStore";
    import CreatureLink from "@/views/Bestiary/CreatureLink.vue";
    import { useUIStore } from "@/store/UI/UIStore";
    import { useFilter } from '@/common/composition/useFilter';
    import { BestiaryFilterDefaults } from '@/enums/Character/BestiaryEnum';
    import usePagination from '@/common/composition/usePagination';

    export default defineComponent({
        name: 'BestiaryView',
        components: {
            CreatureLink,
            ContentLayout
        },
        setup() {
            const route = useRoute();
            const router = useRouter();
            const uiStore = useUIStore();
            const { isMobile } = storeToRefs(uiStore);

            const bestiaryStore = useBestiaryStore();
            const { bestiary } = storeToRefs(bestiaryStore);

            const filter = useFilter({
                url: BestiaryFilterDefaults.url,
                dbName: BestiaryFilterDefaults.dbName
            });

            const { initPages, nextPage } = usePagination({
                url: '/bestiary',
                loadFn: bestiaryStore.bestiaryQuery,
                filter: {
                    isCustomized: filter.isCustomized,
                    value: filter.queryParams
                },
                search: filter.search,
                order: [
                    {
                        field: 'exp',
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

                if (!isMobile && bestiaryStore.bestiary.length) {
                    await router.push({ path: bestiaryStore.bestiary[0].url });
                }
            };

            onBeforeMount(async () => {
                await filter.initFilter();

                await initPages();

                if (!isMobile && bestiaryStore.bestiary.length && route.name === 'bestiary') {
                    await router.push({ path: bestiaryStore.bestiary[0].url });
                }
            });

            return {
                isMobile,
                showRightSide: computed(() => route.name === 'creatureDetail'),
                filter,
                bestiary,
                initPages,
                nextPage,
                onSearch
            };
        }
    });
</script>
