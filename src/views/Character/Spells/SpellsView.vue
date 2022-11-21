<template>
    <component
        :is="layout"
        :filter-instance="filter"
        :show-right-side="showRightSide"
        @search="onSearch"
        @update="initPages"
        @list-end="nextPage"
    >
        <spell-link
            v-for="spell in spells"
            :key="spell.url"
            :in-tab="inTab"
            :spell="spell"
            :to="{ path: spell.url }"
        />
    </component>
</template>

<script lang="ts">
    import {
        computed, defineComponent, onBeforeMount, watch
    } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useRoute, useRouter } from 'vue-router';
    import type { PropType } from 'vue';
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import TabLayout from "@/components/content/TabLayout.vue";
    import SpellLink from "@/views/Character/Spells/SpellLink.vue";
    import { useUIStore } from "@/store/UI/UIStore";
    import type { FilterQueryParams } from '@/common/composition/useFilter';
    import { useFilter } from '@/common/composition/useFilter';
    import { usePagination } from '@/common/composition/usePagination';
    import { SpellsFilterDefaults } from '@/types/Character/Spells.types';

    export default defineComponent({
        components: {
            SpellLink,
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
                type: String,
                default: undefined
            },
            queryParams: {
                type: Object as PropType<FilterQueryParams>,
                default: undefined
            }
        },
        setup(props) {
            const route = useRoute();
            const router = useRouter();
            const uiStore = useUIStore();
            const { isMobile, fullscreen } = storeToRefs(uiStore);

            const layout = computed(() => (
                props.inTab
                    ? TabLayout
                    : ContentLayout
            ));

            const filter = useFilter({
                dbName: SpellsFilterDefaults.dbName,
                storeKey: props.storeKey,
                url: props.filterUrl || SpellsFilterDefaults.url
            });

            const isCustomized = computed(() => !!props.queryParams || filter.isCustomized.value);

            const queryParams = computed(() => {
                if (props.queryParams) {
                    return {
                        ...filter.queryParams.value,
                        ...props.queryParams
                    };
                }

                return filter.queryParams.value;
            });

            const {
                initPages, nextPage, items: spells
            } = usePagination({
                url: '/spells',
                limit: 70,
                filter: {
                    isCustomized,
                    value: queryParams
                },
                search: filter.search,
                order: [
                    {
                        field: 'level',
                        direction: 'asc'
                    },
                    {
                        field: 'name',
                        direction: 'asc'
                    }
                ]
            });

            const onSearch = async () => {
                await initPages();

                if (spells.value.length === 1 && !isMobile.value) {
                    await router.push({ path: spells.value[0].url });
                }
            };

            onBeforeMount(async () => {
                await filter.initFilter();
                await initPages();

                if (!isMobile.value && spells.value.length && route.name === 'spells') {
                    await router.push({ path: spells.value[0].url });
                }
            });

            watch(
                () => props.queryParams,
                initPages,
                {
                    deep: true,
                    immediate: true
                }
            );

            return {
                layout,
                isMobile,
                fullscreen,
                spells,
                filter,
                showRightSide: computed(() => route.name === 'spellDetail'),
                initPages,
                nextPage,
                onSearch
            };
        }
    });
</script>
