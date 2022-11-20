<template>
    <div class="ability-races">
        <race-link
            v-for="(race, raceKey) in races"
            :key="raceKey"
            :race-item="race"
            :to="{ path: race.url }"
            is-ability-calc
            @select="onSelect"
        />
    </div>
</template>

<script lang="ts">
    import { defineComponent, onMounted } from 'vue';
    import RaceLink from '@/views/Character/Races/RaceLink.vue';

    // import { storeToRefs } from 'pinia';
    // import type { TRaceLink } from '@/types/Races.types';
    // import { useRacesStore } from '@/store/Character/RacesStore';

    export default defineComponent({
        components: { RaceLink },
        setup() {
            // const racesStore = useRacesStore();
            // const { races } = storeToRefs(racesStore);
            //
            // onMounted(async () => {
            //     await racesStore.racesQuery();
            // });
            //
            // const onSelect = (e: TRaceLink) => {
            //     // eslint-disable-next-line no-console
            //     console.log(racesStore.race(e.url));
            // };
            //
            // return {
            //     races,
            //     onSelect
            // };
        }
    });
</script>

<style lang="scss" scoped>

</style>
