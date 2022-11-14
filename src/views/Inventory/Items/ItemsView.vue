<template>
    <component
        :is="layout"
        :filter-instance="itemsStore.filter"
        :show-right-side="showRightSide"
        @search="onSearch"
        @update="itemsQuery"
        @list-end="nextPage"
    >
        <item-link
            v-for="item in itemsStore.items"
            :key="item.url"
            :in-tab="inTab"
            :item-item="item"
            :to="{ path: item.url }"
        />
    </component>
</template>

<script>
    import { shallowRef } from "vue";
    import { mapState } from "pinia";
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import TabLayout from "@/components/content/TabLayout.vue";
    import ItemLink from "@/views/Inventory/Items/ItemLink.vue";
    import { useItemsStore } from "@/store/Inventory/ItemsStore";
    import { useUIStore } from "@/store/UI/UIStore";

    export default {
        name: 'ItemsView',
        components: {
            ItemLink,
            TabLayout,
            ContentLayout
        },
        props: {
            inTab: {
                type: Boolean,
                default: false
            },
            storeKey: {
                type: String,
                default: ''
            }

        },
        data: () => ({
            itemsStore: useItemsStore(),
            layoutComponents: {
                tab: shallowRef(TabLayout),
                content: shallowRef(ContentLayout)
            }
        }),
        computed: {
            ...mapState(useUIStore, ['isMobile']),

            showRightSide() {
                return this.$route.name === 'itemDetail';
            },

            layout() {
                return this.inTab
                    ? this.layoutComponents.tab
                    : this.layoutComponents.content;
            }
        },
        watch: {
            storeKey: {
                async handler() {
                    await this.init();
                }
            }

        },
        async mounted() {
            await this.init();

            if (!this.isMobile && this.itemsStore.items.length && this.$route.name === 'items') {
                await this.$router.push({ path: this.itemsStore.items[0].url });
            }
        },
        beforeUnmount() {
            this.itemsStore.clearStore();
        },
        methods: {
            async itemsQuery() {
                await this.itemsStore.initItems();
            },

            async init() {
                await this.itemsStore.initFilter(this.storeKey);
                await this.itemsStore.initItems();
            },

            async nextPage() {
                await this.itemsStore.nextPage();
            },

            async onSearch() {
                await this.itemsQuery();

                if (this.itemsStore.items.length === 1 && !this.isMobile) {
                    await this.$router.push({ path: this.itemsStore.items[0].url });
                }
            }
        }
    };
</script>
