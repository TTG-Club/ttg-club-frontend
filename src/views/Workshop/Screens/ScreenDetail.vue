<template>
    <content-detail class="screen-detail">
        <template #fixed>
            <section-header
                :title="screen?.name?.rus || ''"
                :subtitle="screen?.name?.eng || ''"
                :copy="!error && !loading"
                :fullscreen="!isMobile"
                bookmark
                close-on-desktop
                @close="close"
            />
        </template>

        <template #default>
            <screens-group
                v-if="screen?.chields?.length"
                :child-list="screen.chields"
            />

            <screen-body
                v-else-if="screen"
                :screen="screen"
            />
        </template>
    </content-detail>
</template>

<script>
    import { mapState } from "pinia";
    import SectionHeader from "@/components/UI/SectionHeader.vue";
    import ContentDetail from "@/components/content/ContentDetail.vue";
    import { useUIStore } from "@/store/UI/UIStore";
    import ScreenBody from "@/views/Workshop/Screens/ScreenBody.vue";
    import ScreensGroup from "@/views/Workshop/Screens/ScreensGroup.vue";
    import errorHandler from '@/common/helpers/errorHandler';

    export default {
        components: {
            ScreensGroup,
            ScreenBody,
            ContentDetail,
            SectionHeader
        },
        async beforeRouteUpdate(to, from, next) {
            await this.screenInfoQuery(to.path);

            next();
        },
        data: () => ({
            screen: undefined,
            loading: false,
            error: false,
            abortController: null
        }),
        computed: {
            ...mapState(useUIStore, ['fullscreen', 'isMobile'])
        },
        async mounted() {
            await this.screenInfoQuery(this.$route.path);
        },
        methods: {
            async screenInfoQuery(url) {
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

                    this.screen = resp.data;
                } catch (err) {
                    errorHandler(err);

                    this.error = true;
                } finally {
                    this.loading = false;
                    this.abortController = null;
                }
            },

            close() {
                this.$router.push({ name: 'screens' });
            }
        }
    };
</script>

<style lang="scss" scoped>
    .screen-detail {
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
