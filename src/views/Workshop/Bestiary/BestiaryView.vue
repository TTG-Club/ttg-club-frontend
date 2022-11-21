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
    import CreatureLink from "@/views/Workshop/Bestiary/CreatureLink.vue";
    import { useUIStore } from "@/store/UI/UIStore";
    import { useFilter } from '@/common/composition/useFilter';
    import { usePagination } from '@/common/composition/usePagination';
    import { BestiaryFilterDefaults } from '@/types/Workshop/Bestiary.types';

    export default defineComponent({

        components: {
            CreatureLink,
            ContentLayout
        },
        setup() {
            const route = useRoute();
            const router = useRouter();
            const uiStore = useUIStore();
            const { isMobile } = storeToRefs(uiStore);

            const filter = useFilter({
                url: BestiaryFilterDefaults.url,
                dbName: BestiaryFilterDefaults.dbName
            });

            const {
                initPages, nextPage, items: bestiary
            } = usePagination({
                url: '/bestiary',
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

                if (!isMobile.value && bestiary.value.length) {
                    await router.push({ path: bestiary.value[0].url });
                }
            };

            onBeforeMount(async () => {
                await filter.initFilter();

                await initPages();

                if (!isMobile.value && bestiary.value.length && route.name === 'bestiary') {
                    await router.push({ path: bestiary.value[0].url });
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
