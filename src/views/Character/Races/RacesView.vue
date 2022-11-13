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
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import { useRacesStore } from "@/store/Character/RacesStore";
    import RaceLink from "@/views/Character/Races/RaceLink.vue";
    import { useUIStore } from "@/store/UI/UIStore";

    export default defineComponent({
        name: 'RacesView',
        components: {
            RaceLink,
            ContentLayout
        },
        async beforeRouteEnter(to, from, next) {
            const store = useRacesStore();

            await store.initFilter();
            await store.initRaces();

            next();
        },
        setup() {
            const route = useRoute();
            const router = useRouter();
            const uiStore = useUIStore();
            const racesStore = useRacesStore();

            const { isMobile, fullscreen } = storeToRefs(uiStore);
            const { races, filter } = storeToRefs(racesStore);

            const onRacesQuery = async () => {
                await racesStore.initRaces();
            };

            const onSearch = async () => {
                await racesStore.initRaces();

                if (races.value.length === 1 && !isMobile.value) {
                    await router.push({ path: races.value[0].url });
                }
            };

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
