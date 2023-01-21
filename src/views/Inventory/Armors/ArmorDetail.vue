<template>
    <content-detail>
        <template #fixed>
            <section-header
                :close-on-desktop="fullscreen"
                :fullscreen="!isMobile"
                :subtitle="armor?.name?.eng"
                :title="armor?.name?.rus"
                bookmark
                copy
                print
                @close="close"
            />
        </template>

        <template #default>
            <armor-body
                v-if="armor"
                :armor="armor"
            />
        </template>
    </content-detail>
</template>

<script>
    import { mapState } from 'pinia';
    import SectionHeader from '@/components/UI/SectionHeader.vue';
    import ArmorBody from '@/views/Inventory/Armors/ArmorBody.vue';
    import ContentDetail from '@/components/content/ContentDetail.vue';
    import { useUIStore } from '@/store/UI/UIStore';
    import errorHandler from '@/common/helpers/errorHandler';

    export default {
        components: {
            ContentDetail,
            ArmorBody,
            SectionHeader
        },
        async beforeRouteUpdate(to, from, next) {
            await this.armorInfoQuery(to.path);

            next();
        },
        data: () => ({
            armor: undefined,
            loading: false,
            error: false,
            abortController: null
        }),
        computed: {
            ...mapState(useUIStore, ['fullscreen', 'isMobile'])
        },
        async mounted() {
            await this.armorInfoQuery(this.$route.path);
        },
        methods: {
            async armorInfoQuery(url) {
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

                    this.armor = resp.data;
                } catch (err) {
                    errorHandler(err);

                    this.error = true;
                } finally {
                    this.loading = false;
                    this.abortController = null;
                }
            },

            close() {
                this.$router.push({ name: 'armors' });
            }
        }
    };
</script>

<style lang="scss" scoped>

</style>
