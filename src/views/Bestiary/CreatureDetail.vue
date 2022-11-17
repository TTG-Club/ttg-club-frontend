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
    import SectionHeader from "@/components/UI/SectionHeader.vue";
    import CreatureBody from "@/views/Bestiary/CreatureBody.vue";
    import ContentDetail from "@/components/content/ContentDetail.vue";
    import { useUIStore } from "@/store/UI/UIStore";
    import errorHandler from '@/common/helpers/errorHandler';

    export default {

        components: {
            ContentDetail,
            CreatureBody,
            SectionHeader
        },
        async beforeRouteUpdate(to, from, next) {
            await this.creatureInfoQuery(to.path);

            next();
        },
        data: () => ({
            creature: undefined,
            loading: true,
            error: false,
            abortController: null
        }),
        computed: {
            ...mapState(useUIStore, ['fullscreen', 'isMobile'])
        },
        async mounted() {
            await this.creatureInfoQuery(this.$route.path);
        },
        methods: {
            close() {
                this.$router.push({ name: 'bestiary' });
            },

            async creatureInfoQuery(url) {
                if (this.abortController) {
                    this.abortController.abort();
                }

                try {
                    this.error = false;
                    this.loading = true;
                    this.abortController = new AbortController();

                    const resp = await this.$http.post({
                        url,
                        signal: this.abortController.signal
                    });

                    this.creature = resp.data;
                } catch (err) {
                    errorHandler(err);

                    this.error = true;
                } finally {
                    this.loading = false;
                    this.abortController = null;
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
