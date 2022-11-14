<template>
    <content-layout
        :filter-instance="filter"
        :show-right-side="showRightSide"
        @search="onSearch"
        @update="onRacesQuery"
    >
        <div
            class="race-items"
            :class="{ 'is-selected': showRightSide, 'is-fullscreen': fullscreen }"
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
        computed, defineComponent, onBeforeUnmount
    } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { tryOnBeforeMount } from '@vueuse/core';
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import { useRacesStore } from "@/store/Character/RacesStore";
    import RaceLink from "@/views/Character/Races/RaceLink.vue";
    import { useUIStore } from "@/store/UI/UIStore";
    import { useFilter } from '@/common/composition/useFilter';
    import { RaceFilterDefaults } from '@/enums/Character/RacesEnum';
    import type { ListQuery } from '@/types/DefaultTypes';

    export default defineComponent({
        name: 'RacesView',
        components: {
            RaceLink,
            ContentLayout
        },
        setup() {
            const route = useRoute();
            const router = useRouter();
            const uiStore = useUIStore();
            const { isMobile, fullscreen } = storeToRefs(uiStore);

            const racesStore = useRacesStore();
            const { races } = storeToRefs(racesStore);

            const filter = useFilter();

            const initFilter = async () => {
                await filter.initFilter({
                    dbName: RaceFilterDefaults.dbName,
                    url: RaceFilterDefaults.url
                });
            };

            const initRaces = async () => {
                const options: ListQuery = {};

                if (filter.isCustomized.value) {
                    options.filter = filter.queryParams.value;
                }

                await racesStore.initRaces(options);
            };

            const onRacesQuery = async () => {
                await initRaces();
            };

            const onSearch = async () => {
                await initRaces();

                if (races.value.length === 1 && !isMobile.value) {
                    await router.push({ path: races.value[0].url });
                }
            };

            tryOnBeforeMount(async () => {
                await initFilter();
                await initRaces();
            });

            onBeforeUnmount(() => {
                racesStore.clearStore();
            });

            return {
                isMobile,
                fullscreen,
                races,
                filter,
                showRightSide: computed(() => route.name === 'raceDetail'),
                onRacesQuery,
                onSearch,
                initFilter
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
