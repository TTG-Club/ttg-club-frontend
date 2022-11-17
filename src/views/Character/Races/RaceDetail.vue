<template>
    <content-detail class="race-detail">
        <template #fixed>
            <section-header
                :copy="!error && !loading"
                :subtitle="race?.name?.eng || ''"
                :title="race?.name?.rus || ''"
                bookmark
                print
                fullscreen
                close-on-desktop
                @close="close"
            />
        </template>

        <template #default>
            <race-body
                v-if="race"
                :race="race"
            />
        </template>
    </content-detail>
</template>

<script>
    import { mapState } from "pinia";
    import SectionHeader from '@/components/UI/SectionHeader.vue';
    import { useRacesStore } from '@/store/Character/RacesStore';
    import errorHandler from "@/common/helpers/errorHandler";
    import RaceBody from "@/views/Character/Races/RaceBody.vue";
    import ContentDetail from "@/components/content/ContentDetail.vue";
    import { useUIStore } from "@/store/UI/UIStore";

    export default {

        components: {
            ContentDetail,
            RaceBody,
            SectionHeader
        },
        async beforeRouteUpdate(to, from, next) {
            await this.loadNewRace(to.path);

            next();
        },
        beforeRouteLeave(to, from) {
            if (to.name !== 'races') {
                return;
            }

            this.$emit('scroll-to-last-active', from.path);
        },
        data: () => ({
            raceStore: useRacesStore(),
            race: undefined,
            loading: false,
            error: false
        }),
        computed: {
            ...mapState(useUIStore, ['isMobile'])
        },
        async mounted() {
            await this.loadNewRace(this.$route.path);

            this.$emit('scroll-to-active');
        },
        methods: {
            async loadNewRace(url) {
                try {
                    this.error = false;
                    this.loading = true;

                    this.race = await this.raceStore.raceInfoQuery(url);

                    this.loading = false;
                } catch (err) {
                    this.loading = false;
                    this.error = true;

                    errorHandler(err);
                }
            },

            close() {
                this.$router.push({ name: 'races' });
            }
        }
    };
</script>

<style lang="scss" scoped>

</style>
