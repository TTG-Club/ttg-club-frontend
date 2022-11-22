<template>
    <content-detail class="option-detail">
        <template #fixed>
            <section-header
                :close-on-desktop="fullscreen"
                :copy="!error && !loading"
                :fullscreen="!isMobile"
                :subtitle="option?.name?.eng || ''"
                :title="option?.name?.rus || ''"
                bookmark
                print
                @close="close"
            />
        </template>

        <template #default>
            <option-body
                v-if="option"
                :option="option"
            />
        </template>
    </content-detail>
</template>

<script>
    import { mapState } from "pinia";
    import SectionHeader from '@/components/UI/SectionHeader.vue';
    import errorHandler from "@/common/helpers/errorHandler";
    import OptionBody from "@/views/Character/Options/OptionBody.vue";
    import ContentDetail from "@/components/content/ContentDetail.vue";
    import { useUIStore } from "@/store/UI/UIStore";

    export default {
        components: {
            ContentDetail,
            OptionBody,
            SectionHeader
        },
        async beforeRouteUpdate(to, from, next) {
            await this.optionInfoQuery(to.path);

            next();
        },
        data: () => ({
            option: undefined,
            loading: false,
            error: false,
            abortController: null
        }),
        computed: {
            ...mapState(useUIStore, ['fullscreen', 'isMobile'])
        },
        async mounted() {
            await this.optionInfoQuery(this.$route.path);
        },
        methods: {
            async optionInfoQuery(url) {
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

                    this.option = resp.data;
                } catch (err) {
                    errorHandler(err);

                    this.error = true;
                } finally {
                    this.loading = false;
                    this.abortController = null;
                }
            },

            close() {
                this.$router.push({ name: 'options' });
            }
        }
    };
</script>

<style lang="scss" scoped>

</style>
