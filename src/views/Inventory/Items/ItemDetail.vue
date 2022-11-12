<template>
    <content-detail class="item-detail">
        <template #fixed>
            <section-header
                :close-on-desktop="fullscreen"
                :copy="!error && !loading"
                :fullscreen="!isMobile"
                :subtitle="item?.name?.eng || ''"
                :title="item?.name?.rus || ''"
                bookmark
                print
                @close="close"
            />
        </template>

        <template #default>
            <item-body
                v-if="item"
                :item="item"
            />
        </template>
    </content-detail>
</template>

<script>
    import { mapState } from "pinia";
    import SectionHeader from '@/components/UI/SectionHeader.vue';
    import errorHandler from "@/common/helpers/errorHandler";
    import { useItemsStore } from "@/store/Inventory/ItemsStore";
    import ItemBody from "@/views/Inventory/Items/ItemBody.vue";
    import ContentDetail from "@/components/content/ContentDetail.vue";
    import { useUIStore } from "@/store/UI/UIStore";

    export default {
        name: 'ItemDetail',
        components: {
            ContentDetail,
            ItemBody,
            SectionHeader
        },
        async beforeRouteUpdate(to, from, next) {
            await this.loadNewItem(to.path);

            next();
        },
        data: () => ({
            itemStore: useItemsStore(),
            item: undefined,
            loading: false,
            error: false
        }),
        computed: {
            ...mapState(useUIStore, ['fullscreen', 'isMobile'])
        },
        async mounted() {
            await this.loadNewItem(this.$route.path);
        },
        methods: {
            async loadNewItem(url) {
                try {
                    this.error = false;
                    this.loading = true;

                    this.item = await this.itemStore.itemInfoQuery(url);

                    this.loading = false;
                } catch (err) {
                    this.loading = false;
                    this.error = true;

                    errorHandler(err);
                }
            },

            close() {
                this.$router.push({ name: 'items' });
            }
        }
    };
</script>

<style lang="scss" scoped>

</style>
