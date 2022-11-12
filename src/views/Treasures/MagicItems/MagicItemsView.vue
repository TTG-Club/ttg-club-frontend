<template>
    <component
        :is="layout"
        :filter-instance="filter"
        :show-right-side="showRightSide"
        @search="onSearch"
        @update="magicItemsQuery"
        @list-end="nextPage"
    >
        <magic-item-link
            v-for="item in magicItems"
            :key="item.url"
            :in-tab="inTab"
            :magic-item="item"
            :to="{ path: item.url }"
        />
    </component>
</template>

<script>
    import { shallowRef } from "vue";
    import { mapState } from "pinia";
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import TabLayout from "@/components/content/TabLayout.vue";
    import CreatureLink from "@/views/Bestiary/CreatureLink.vue";
    import { useMagicItemsStore } from "@/store/Treasures/MagicItemsStore";
    import MagicItemLink from "@/views/Treasures/MagicItems/MagicItemLink.vue";
    import { useUIStore } from "@/store/UI/UIStore";

    export default {
        name: 'MagicItemsView',
        components: {
            MagicItemLink,
            CreatureLink,
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
            },
            customFilter: {
                type: Object,
                default: undefined
            }
        },
        data: () => ({
            magicItemsStore: useMagicItemsStore(),
            layoutComponents: {
                tab: shallowRef(TabLayout),
                content: shallowRef(ContentLayout)
            }
        }),
        computed: {
            ...mapState(useUIStore, ['isMobile']),

            filter() {
                return this.magicItemsStore.getFilter || undefined;
            },

            magicItems() {
                return this.magicItemsStore.getItems || [];
            },

            showRightSide() {
                return this.$route.name === 'magicItemDetail';
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
            },
            customFilter: {
                deep: true,
                async handler() {
                    await this.init();
                }
            }
        },
        async mounted() {
            await this.init();

            if (!this.isMobile && this.magicItems.length && this.$route.name === 'magicItems') {
                await this.$router.push({ path: this.magicItems[0].url });
            }
        },
        beforeUnmount() {
            this.magicItemsStore.clearStore();
        },
        methods: {
            async init() {
                await this.magicItemsStore.initFilter(this.storeKey, this.customFilter);
                await this.magicItemsStore.initItems();
            },

            async magicItemsQuery() {
                await this.magicItemsStore.initItems();
            },

            async nextPage() {
                await this.magicItemsStore.nextPage();
            },

            async onSearch() {
                await this.magicItemsQuery();

                if (this.magicItems.length === 1 && !this.isMobile) {
                    await this.$router.push({ path: this.magicItems[0].url });
                }
            }
        }
    };
</script>
