<template>
    <component
        :is="layout"
        :filter-instance="filter"
        :show-right-side="showRightSide"
        @search="onSearch"
        @update="backgroundsQuery"
    >
        <background-link
            v-for="background in backgrounds"
            :key="background.url"
            :background-item="background"
            :in-tab="inTab"
            :to="{ path: background.url }"
        />
    </component>
</template>

<script>
    import { shallowRef } from "vue";
    import { mapState } from "pinia";
    import ContentLayout from '@/components/content/ContentLayout';
    import TabLayout from "@/components/content/TabLayout";
    import { useBackgroundsStore } from "@/store/Character/BackgroundsStore";
    import BackgroundLink from "@/views/Character/Backgrounds/BackgroundLink";
    import { useUIStore } from "@/store/UI/UIStore";

    export default {
        name: 'BackgroundsView',
        components: {
            BackgroundLink,
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
            backgroundsStore: useBackgroundsStore(),
            layoutComponents: {
                tab: shallowRef(TabLayout),
                content: shallowRef(ContentLayout)
            }
        }),
        computed: {
            ...mapState(useUIStore, ['isMobile']),

            filter() {
                return this.backgroundsStore.getFilter || undefined;
            },

            backgrounds() {
                return this.backgroundsStore.getBackgrounds || [];
            },

            showRightSide() {
                return this.$route.name === 'backgroundDetail';
            },

            layout() {
                return this.inTab
                    ? this.layoutComponents.tab
                    : this.layoutComponents.content;
            }
        },
        async mounted() {
            await this.backgroundsStore.initFilter(this.storeKey);
            await this.backgroundsStore.initBackgrounds();

            if (!this.isMobile && this.backgrounds.length && this.$route.name === 'backgrounds') {
                await this.$router.push({ path: this.backgrounds[0].url });
            }
        },
        beforeUnmount() {
            this.backgroundsStore.clearStore();
        },
        methods: {
            async backgroundsQuery() {
                await this.backgroundsStore.initBackgrounds();
            },

            async onSearch() {
                this.backgroundsQuery();

                if (this.backgrounds.length === 1 && !this.isMobile) {
                    await this.$router.push({ path: this.backgrounds[0].url });
                }
            }
        }
    };
</script>
