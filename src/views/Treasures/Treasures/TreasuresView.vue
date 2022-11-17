<template>
    <component
        :is="layout"
        :filter-instance="treasuresStore.filter"
        @search="treasuresQuery"
        @update="treasuresQuery"
        @list-end="nextPage"
    >
        <treasure-item
            v-for="(treasure, key) in treasuresStore.treasures"
            :key="treasure.name.eng + key"
            :in-tab="inTab"
            :treasure="treasure"
        />
    </component>
</template>

<script>
    import { shallowRef } from "vue";
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import TabLayout from "@/components/content/TabLayout.vue";
    import { useTreasuresStore } from "@/store/Treasures/TreasuresStore";
    import TreasureItem from "@/views/Treasures/Treasures/TreasureItem.vue";

    export default {

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
        },
        beforeUnmount() {
            this.treasuresStore.clearStore();
        },
        methods: {
            async init() {
                await this.treasuresStore.initFilter(this.storeKey);
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
