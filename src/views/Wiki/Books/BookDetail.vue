<template>
    <content-detail class="book-detail">
        <template #fixed>
            <section-header
                :close-on-desktop="fullscreen"
                :copy="!error && !loading"
                :fullscreen="!isMobile"
                :subtitle="book?.name?.eng || ''"
                :title="book?.name?.rus || ''"
                bookmark
                @close="close"
            />
        </template>

        <template #default>
            <book-body
                v-if="book"
                :book="book"
            />
        </template>
    </content-detail>
</template>

<script>
    import { mapState } from 'pinia';
    import SectionHeader from '@/components/UI/SectionHeader.vue';
    import errorHandler from '@/common/helpers/errorHandler';
    import BookBody from '@/views/Wiki/Books/BookBody.vue';
    import ContentDetail from '@/components/content/ContentDetail.vue';
    import { useUIStore } from '@/store/UI/UIStore';

    export default {
        components: {
            ContentDetail,
            BookBody,
            SectionHeader
        },
        async beforeRouteUpdate(to, from, next) {
            await this.bookInfoQuery(to.path);

            next();
        },
        data: () => ({
            book: undefined,
            loading: false,
            error: false,
            abortController: null
        }),
        computed: {
            ...mapState(useUIStore, ['fullscreen', 'isMobile'])
        },
        async mounted() {
            await this.bookInfoQuery(this.$route.path);
        },
        methods: {
            async bookInfoQuery(url) {
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

                    this.book = resp.data;
                } catch (err) {
                    errorHandler(err);

                    this.error = true;
                } finally {
                    this.loading = false;
                    this.abortController = null;
                }
            },

            close() {
                this.$router.push({ name: 'books' });
            }
        }
    };
</script>

<style lang="scss" scoped>

</style>
