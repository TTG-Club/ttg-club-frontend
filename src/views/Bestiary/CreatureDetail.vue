<template>
    <content-detail class="creature-detail">
        <template #fixed>
            <section-header
                :close-on-desktop="fullscreen"
                :copy="!error && !loading"
                :fullscreen="!isMobile"
                :subtitle="creature?.name?.eng || ''"
                :title="creature?.name?.rus || ''"
                bookmark
                print
                @close="close"
                @export-foundry="exportFoundry"
            />
        </template>

        <template #default>
            <creature-body
                v-if="creature"
                :creature="creature"
            />
        </template>
    </content-detail>
</template>

<script>
    import { mapState } from "pinia";
    import SectionHeader from "@/components/UI/SectionHeader";
    import { useBestiaryStore } from "@/store/Bestiary/BestiaryStore";
    import CreatureBody from "@/views/Bestiary/CreatureBody";
    import ContentDetail from "@/components/content/ContentDetail";
    import { useUIStore } from "@/store/UI/UIStore";

    export default {
        name: 'CreatureDetail',
        components: {
            ContentDetail,
            CreatureBody,
            SectionHeader
        },
        async beforeRouteUpdate(to, from, next) {
            await this.loadNewCreature(to.path);

            next();
        },
        data: () => ({
            bestiaryStore: useBestiaryStore(),
            creature: undefined,
            loading: true,
            error: false
        }),
        computed: {
            ...mapState(useUIStore, ['fullscreen', 'isMobile'])
        },
        async mounted() {
            await this.loadNewCreature(this.$route.path);
        },
        methods: {
            close() {
                this.$router.push({ name: 'bestiary' });
            },

            async loadNewCreature(url) {
                try {
                    this.error = false;
                    this.loading = true;

                    this.creature = await this.bestiaryStore.creatureInfoQuery(url);

                    this.loading = false;
                } catch (err) {
                    this.error = true;
                }
            },

            exportFoundry() {
                window.open(`/api/fvtt/v1/bestiary/${ this.creature.id }`, '_self');
            }
        }
    };
</script>

<style lang="scss" scoped>
    .creature-detail {
        overflow: hidden;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;

        &__loader {
            width: 100%;
            flex: 1 1 100%;
            display: flex;
            align-items: center;
            justify-content: center;

            &_img {
                width: 70%;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;

                &:before {
                    content: '';
                    display: block;
                    width: 100%;
                    padding-bottom: 100%;
                }

                img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    position: absolute;
                    filter: drop-shadow(0 0 12px var(--bg-main));
                }
            }
        }
    }
</style>
