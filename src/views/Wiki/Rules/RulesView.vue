<template>
    <component
        :is="layout"
        :filter-instance="filter"
        :show-right-side="showRightSide"
        @search="onSearch"
        @update="rulesQuery"
        @list-end="nextPage"
    >
        <rule-link
            v-for="rule in rules"
            :key="rule.url"
            :in-tab="inTab"
            :rule="rule"
            :to="{ path: rule.url }"
        />
    </component>
</template>

<script>
    import { shallowRef } from "vue";
    import { mapState } from "pinia";
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import TabLayout from "@/components/content/TabLayout.vue";
    import { useRulesStore } from "@/store/Wiki/RulesStore";
    import RuleLink from "@/views/Wiki/Rules/RuleLink.vue";
    import { useUIStore } from "@/store/UI/UIStore";

    export default {
        name: 'RulesView',
        components: {
            RuleLink,
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
            rulesStore: useRulesStore(),
            layoutComponents: {
                tab: shallowRef(TabLayout),
                content: shallowRef(ContentLayout)
            }
        }),
        computed: {
            ...mapState(useUIStore, ['isMobile']),

            showRightSide() {
                return this.$route.name === 'ruleDetail';
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

            if (!this.isMobile && this.rulesStore.rules.length && this.$route.name === 'rules') {
                await this.$router.push({ path: this.rulesStore.rules[0].url });
            }
        },
        beforeUnmount() {
            this.rulesStore.clearStore();
        },
        methods: {
            async rulesQuery() {
                await this.rulesStore.initRules();
            },

            async init() {
                await this.rulesStore.initFilter(this.storeKey);
                await this.rulesStore.initRules();
            },

            async nextPage() {
                await this.rulesStore.nextPage();
            },

            async onSearch() {
                await this.rulesQuery();

                if (this.rulesStore.rules.length === 1 && !this.isMobile) {
                    await this.$router.push({ path: this.rulesStore.rules[0].url });
                }
            }
        }
    };
</script>
