<template>
    <component
        :is="layout"
        :filter-instance="filter"
        :show-right-side="showRightSide"
        @search="onSearch"
        @update="optionsQuery"
    >
        <option-link
            v-for="option in options"
            :key="option.url"
            :in-tab="inTab"
            :option-item="option"
            :to="{ path: option.url }"
        />
    </component>
</template>

<script>
    import { shallowRef } from "vue";
    import { mapState } from "pinia";
    import ContentLayout from '@/components/content/ContentLayout';
    import TabLayout from "@/components/content/TabLayout";
    import { useOptionsStore } from "@/store/Character/OptionsStore";
    import OptionLink from "@/views/Character/Options/OptionLink";
    import { useUIStore } from "@/store/UI/UIStore";

    export default {
        name: 'OptionsView',
        components: {
            OptionLink,
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
            filterUrl: {
                type: [String, undefined],
                default: undefined
            },
            books: {
                type: [Array, undefined],
                default: undefined
            }
        },
        data: () => ({
            optionsStore: useOptionsStore(),
            layoutComponents: {
                tab: shallowRef(TabLayout),
                content: shallowRef(ContentLayout)
            }
        }),
        computed: {
            ...mapState(useUIStore, ['isMobile']),

            filter() {
                return this.optionsStore.getFilter || undefined;
            },

            options() {
                return this.optionsStore.getOptions || [];
            },

            showRightSide() {
                return this.$route.name === 'optionDetail';
            },

            layout() {
                return this.inTab
                    ? this.layoutComponents.tab
                    : this.layoutComponents.content;
            },

            useAutoOpenFirst() {
                return !this.isMobile && !!this.options.length && this.$route.name === 'options' && !this.inTab;
            }
        },
        watch: {
            storeKey: {
                async handler() {
                    await this.init();
                }
            },
            filterUrl: {
                async handler() {
                    await this.init();
                }
            },
            books: {
                deep: true,
                async handler() {
                    await this.init();
                }
            }
        },
        async mounted() {
            await this.init();

            if (!this.isMobile && this.options.length && this.$route.name === 'options' && !this.inTab) {
                await this.$router.push({ path: this.options[0].url });
            }
        },
        beforeUnmount() {
            this.optionsStore.clearStore();
        },
        methods: {
            async optionsQuery() {
                await this.optionsStore.initOptions(this.books);
            },

            async init() {
                await this.optionsStore.initFilter(this.storeKey, this.filterUrl);
                await this.optionsStore.initOptions(this.books);
            },

            async onSearch() {
                await this.optionsQuery();

                if (this.options.length === 1 && this.useAutoOpenFirst) {
                    await this.$router.push({ path: this.options[0].url });
                }
            }
        }
    };
</script>
