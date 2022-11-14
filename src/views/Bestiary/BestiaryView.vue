<template>
    <component
        :is="layout"
        :filter-instance="bestiaryStore.filter"
        :show-right-side="showRightSide"
        @search="onSearch"
        @update="bestiaryQuery"
        @list-end="nextPage"
    >
        <creature-link
            v-for="creature in bestiaryStore.bestiary"
            :key="creature.url"
            :creature="creature"
            :in-tab="inTab"
            :to="{ path: creature.url }"
        />
    </component>
</template>

<script>
    import { shallowRef } from "vue";
    import { mapState } from "pinia";
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import TabLayout from "@/components/content/TabLayout.vue";
    import { useBestiaryStore } from "@/store/Bestiary/BestiaryStore";
    import CreatureLink from "@/views/Bestiary/CreatureLink.vue";
    import { useUIStore } from "@/store/UI/UIStore";

    export default {
        name: 'BestiaryView',
        components: {
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
            }
        },
        data: () => ({
            bestiaryStore: useBestiaryStore(),
            layoutComponents: {
                tab: shallowRef(TabLayout),
                content: shallowRef(ContentLayout)
            }
        }),
        computed: {
            ...mapState(useUIStore, ['isMobile']),

            showRightSide() {
                return this.$route.name === 'creatureDetail';
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

            if (!this.isMobile && this.bestiaryStore.bestiary.length && this.$route.name === 'bestiary') {
                await this.$router.push({ path: this.bestiary[0].url });
            }
        },
        beforeUnmount() {
            this.bestiaryStore.clearStore();
        },
        methods: {
            async init() {
                await this.bestiaryStore.initFilter(this.storeKey);
                await this.bestiaryStore.initBestiary();
            },

            async bestiaryQuery() {
                await this.bestiaryStore.initBestiary();
            },

            async nextPage() {
                await this.bestiaryStore.nextPage();
            },

            async onSearch() {
                await this.bestiaryStore.initBestiary();

                if (this.bestiaryStore.bestiary.length === 1 && !this.isMobile) {
                    await this.$router.push({ path: this.bestiaryStore.bestiary[0].url });
                }
            }
        }
    };
</script>
