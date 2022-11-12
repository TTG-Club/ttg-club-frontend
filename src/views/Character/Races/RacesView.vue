<template>
    <content-layout
        :filter-instance="filter"
        :show-right-side="showRightSide"
        @search="onSearch"
        @update="racesQuery"
    >
        <div
            ref="races"
            class="race-items"
            :class="{ 'is-selected': showRightSide, 'is-fullscreen': fullscreen }"
        >
            <race-link
                v-for="race in getRaces"
                :key="race.url"
                :race-item="race"
                :to="{ path: race.url }"
            />
        </div>
    </content-layout>
</template>

<script>
    import {
        mapActions, mapState
    } from "pinia";
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import { useRacesStore } from "@/store/Character/RacesStore";
    import RaceLink from "@/views/Character/Races/RaceLink.vue";
    import { useUIStore } from "@/store/UI/UIStore";

    export default {
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
        computed: {
            ...mapState(useUIStore, ['isMobile', 'fullscreen']),
            ...mapState(useRacesStore, ['getRaces', 'getFilter']),

            filter() {
                return this.getFilter || undefined;
            },

            showRightSide() {
                return this.$route.name === 'raceDetail';
            }
        },
        beforeUnmount() {
            this.clearStore();
        },
        methods: {
            ...mapActions(useRacesStore, [
                'initFilter',
                'initRaces',
                'clearStore'
            ]),

            async racesQuery() {
                await this.initRaces();
            },

            async onSearch() {
                await this.racesQuery();

                if (this.getRaces.length === 1 && !this.isMobile) {
                    await this.$router.push({ path: this.getRaces[0].url });
                }
            }
        }
    };
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
