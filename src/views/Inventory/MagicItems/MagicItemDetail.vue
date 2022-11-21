<template>
    <content-detail class="magic-item-detail">
        <template #fixed>
            <section-header
                :close-on-desktop="fullscreen"
                :copy="!error && !loading"
                :fullscreen="!isMobile"
                :subtitle="magicItem?.name?.eng || ''"
                :title="magicItem?.name?.rus || ''"
                bookmark
                @close="close"
            />
        </template>

        <template #default>
            <magic-item-body
                v-if="magicItem"
                :magic-item="magicItem"
            />
        </template>
    </content-detail>
</template>

<script>
    import { mapState } from "pinia";
    import SectionHeader from "@/components/UI/SectionHeader.vue";
    import MagicItemBody from "@/views/Inventory/MagicItems/MagicItemBody.vue";
    import ContentDetail from "@/components/content/ContentDetail.vue";
    import { useUIStore } from "@/store/UI/UIStore";
    import errorHandler from '@/common/helpers/errorHandler';

    export default {
        components: {
            ContentDetail,
            MagicItemBody,
            SectionHeader
        },
        async beforeRouteUpdate(to, from, next) {
            await this.magicItemInfoQuery(to.path);

            next();
        },
        data: () => ({
            magicItem: undefined,
            loading: false,
            error: false,
            abortController: null
        }),
        computed: {
            ...mapState(useUIStore, ['fullscreen', 'isMobile'])
        },
        async mounted() {
            await this.magicItemInfoQuery(this.$route.path);
        },
        methods: {
            async magicItemInfoQuery(url) {
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

                    this.magicItem = resp.data;
                } catch (err) {
                    errorHandler(err);

                    this.error = true;
                } finally {
                    this.loading = false;
                    this.abortController = null;
                }
            },

            close() {
                this.$router.push({ name: 'magicItems' });
            }
        }
    };
</script>

<style lang="scss" scoped>
    .magic-item-detail {
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
