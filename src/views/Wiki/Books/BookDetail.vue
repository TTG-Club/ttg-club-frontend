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
    import { mapState } from "pinia";
    import SectionHeader from '@/components/UI/SectionHeader.vue';
    import errorHandler from "@/common/helpers/errorHandler";
    import { useBooksStore } from "@/store/Wiki/BooksStore";
    import BookBody from "@/views/Wiki/Books/BookBody.vue";
    import ContentDetail from "@/components/content/ContentDetail.vue";
    import { useUIStore } from "@/store/UI/UIStore";

    export default {

        components: {
            ContentDetail,
            BookBody,
            SectionHeader
        },
        async beforeRouteUpdate(to, from, next) {
            await this.loadNewBook(to.path);

            next();
        },
        data: () => ({
            bookStore: useBooksStore(),
            book: undefined,
            loading: false,
            error: false
        }),
        computed: {
            ...mapState(useUIStore, ['fullscreen', 'isMobile'])
        },
        async mounted() {
            await this.loadNewBook(this.$route.path);
        },
        methods: {
            async loadNewBook(url) {
                try {
                    this.error = false;
                    this.loading = true;

                    this.book = await this.bookStore.bookInfoQuery(url);

                    this.loading = false;
                } catch (err) {
                    this.loading = false;
                    this.error = true;

                    errorHandler(err);
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
