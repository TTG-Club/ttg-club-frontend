<template>
    <component
        :is="layout"
        :filter-instance="filter"
        @search="treasuresQuery"
        @update="treasuresQuery"
        @list-end="nextPage"
    >
        <treasure-item
            v-for="(treasure, key) in treasures"
            :key="treasure.name.eng + key"
            :in-tab="inTab"
            :treasure="treasure"
        />
    </component>
</template>

<script>
    import { shallowRef } from "vue";
    import ContentLayout from '@/components/content/ContentLayout';
    import TabLayout from "@/components/content/TabLayout";
    import { useTreasuresStore } from "@/store/Treasures/TreasuresStore";
    import TreasureItem from "@/views/Treasures/Treasures/TreasureItem";

    export default {
        name: 'TreasuresView',
        components: {
            TreasureItem,
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
            treasuresStore: useTreasuresStore(),
            layoutComponents: {
                tab: shallowRef(TabLayout),
                content: shallowRef(ContentLayout)
            }
        }),
        computed: {
            filter() {
                return this.treasuresStore.getFilter || undefined;
            },

            treasures() {
                return this.treasuresStore.getTreasures || [];
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
        },
        beforeUnmount() {
            this.treasuresStore.clearStore();
        },
        methods: {
            async init() {
                await this.treasuresStore.initFilter(this.storeKey, this.customFilter);
                await this.treasuresStore.initTreasures();
            },

            async treasuresQuery() {
                await this.treasuresStore.initTreasures();
            },

            async nextPage() {
                await this.treasuresStore.nextPage();
            }
        }
    };
</script>
