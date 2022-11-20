<template>
    <content-detail class="background-detail">
        <template #fixed>
            <section-header
                :close-on-desktop="fullscreen"
                :copy="!error && !loading"
                :fullscreen="!isMobile"
                :subtitle="background?.name?.eng || ''"
                :title="background?.name?.rus || ''"
                bookmark
                print
                @close="close"
            />
        </template>

        <template #default>
            <background-body
                v-if="background"
                :background="background"
            />
        </template>
    </content-detail>
</template>

<script>
    import { mapState } from "pinia";
    import SectionHeader from '@/components/UI/SectionHeader.vue';
    import errorHandler from "@/common/helpers/errorHandler";
    import BackgroundBody from "@/views/Character/Backgrounds/BackgroundBody.vue";
    import ContentDetail from "@/components/content/ContentDetail.vue";
    import { useUIStore } from "@/store/UI/UIStore";

    export default {
        components: {
            ContentDetail,
            BackgroundBody,
            SectionHeader
        },
        async beforeRouteUpdate(to, from, next) {
            await this.backgroundInfoQuery(to.path);

            next();
        },
        data: () => ({
            background: undefined,
            loading: false,
            error: false,
            abortController: null
        }),
        computed: {
            ...mapState(useUIStore, ['fullscreen', 'isMobile'])
        },
        async mounted() {
            await this.backgroundInfoQuery(this.$route.path);
        },
        methods: {
            async backgroundInfoQuery(url) {
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

                    this.background = resp.data;
                } catch (err) {
                    errorHandler(err);

                    this.error = true;
                } finally {
                    this.loading = false;
                    this.abortController = null;
                }
            },

            close() {
                this.$router.push({ name: 'backgrounds' });
            }
        }
    };
</script>

<style lang="scss" scoped>

</style>
