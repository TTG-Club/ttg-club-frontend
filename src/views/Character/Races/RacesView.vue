<template>
    <content-layout
        title="Расы и происхождения"
        :filter-instance="filter"
        :show-right-side="showRightSide"
        @search="onSearch"
        @update="initPages"
    >
        <div
            :class="{ 'is-selected': showRightSide, 'is-fullscreen': fullscreen }"
            class="race-items"
        >
            <race-link
                v-for="race in races"
                :key="race.url"
                :race-item="race"
                :to="{ path: race.url }"
            />
        </div>
    </content-layout>
</template>

<script lang="ts">
    import { storeToRefs } from 'pinia';
    import {
        defineComponent, nextTick, onBeforeMount, ref, watch
    } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import RaceLink from '@/views/Character/Races/RaceLink.vue';
    import { useUIStore } from '@/store/UI/UIStore';
    import { useFilter } from '@/common/composition/useFilter';
    import { usePagination } from '@/common/composition/usePagination';
    import { RacesFilterDefaults } from '@/types/Character/Races.types';

    export default defineComponent({

        components: {
            RaceLink,
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

            const showRightSide = ref(false);

            const filter = useFilter({
                dbName: RacesFilterDefaults.dbName,
                url: RacesFilterDefaults.url
            });

            const {
                initPages,
                items: races
            } = usePagination({
                url: '/races',
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

            watch(
                [races, () => route.name],
                () => {
                    nextTick(() => {
                        showRightSide.value = !!races.value.length && route.name === 'raceDetail';
                    });
                },
                { flush: 'post' }
            );

            const onSearch = async () => {
                await initPages();

                if (races.value.length === 1 && !isMobile.value) {
                    await router.push({ path: races.value[0].url });
                }
            };

            onBeforeMount(async () => {
                await filter.initFilter();
                await initPages();
            });

            return {
                isMobile,
                fullscreen,
                races,
                filter,
                showRightSide,
                initPages,
                onSearch
            };
        }
    });
</script>

<style lang="scss" scoped>
    .race-items {
        width: 100%;
        padding: 0;
        display: grid;
        grid-gap: 16px;
        align-items: start;
        grid-template-columns: repeat(1, 1fr);

        @include media-min($sm) {
            grid-template-columns: repeat(2, 1fr);
        }

        @include media-min($lg) {
            grid-template-columns: repeat(4, 1fr);
        }

        @include media-min($xxl) {
            grid-template-columns: repeat(5, 1fr);
        }

        &.is-selected {
            @include media-min($sm) {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    }
</style>
