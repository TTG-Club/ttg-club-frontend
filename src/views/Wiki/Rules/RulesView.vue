<template>
    <content-layout
        :filter-instance="filter"
        :show-right-side="showRightSide"
        @search="onSearch"
        @update="initPages"
        @list-end="nextPage"
    >
        <rule-link
            v-for="rule in rules"
            :key="rule.url"
            :rule="rule"
            :to="{ path: rule.url }"
        />
    </content-layout>
</template>

<script lang="ts">
    import {
        computed, defineComponent, onBeforeMount
    } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useRoute, useRouter } from 'vue-router';
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import RuleLink from '@/views/Wiki/Rules/RuleLink.vue';
    import { useUIStore } from '@/store/UI/UIStore';
    import { useFilter } from '@/common/composition/useFilter';
    import { usePagination } from '@/common/composition/usePagination';
    import { RulesFilterDefaults } from '@/types/Wiki/Rules.types';

    export default defineComponent({
        components: {
            RuleLink,
            ContentLayout
        },
        setup() {
            const route = useRoute();
            const router = useRouter();
            const uiStore = useUIStore();

            const {
                isMobile,
                fullscreen
            } = storeToRefs(uiStore);

            const filter = useFilter({
                dbName: RulesFilterDefaults.dbName,
                url: RulesFilterDefaults.url
            });

            const {
                initPages,
                nextPage,
                items: rules
            } = usePagination({
                url: '/rules',
                limit: 70,
                filter: {
                    isCustomized: filter.isCustomized,
                    value: filter.queryParams
                },
                search: filter.search,
                order: [
                    {
                        field: 'name',
                        direction: 'asc'
                    }
                ]
            });

            const onSearch = async () => {
                await initPages();

                if (rules.value.length === 1 && !isMobile.value) {
                    await router.push({ path: rules.value[0].url });
                }
            };

            onBeforeMount(async () => {
                await filter.initFilter();
                await initPages();

                if (!isMobile.value && rules.value.length && route.name === 'rules') {
                    await router.push({ path: rules.value[0].url });
                }
            });

            return {
                isMobile,
                fullscreen,
                rules,
                filter,
                showRightSide: computed(() => route.name === 'ruleDetail'),
                initPages,
                nextPage,
                onSearch
            };
        }
    });
</script>
