<template>
    <component
        :is="layout"
        :filter-instance="filter"
        :show-right-side="showRightSide"
        @search="onSearch"
        @update="initPages"
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

<script lang="ts">
    import {
        computed, defineComponent, onBeforeMount, watch
    } from 'vue';
    import type { PropType } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useRoute, useRouter } from 'vue-router';
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import TabLayout from "@/components/content/TabLayout.vue";
    import OptionLink from "@/views/Character/Options/OptionLink.vue";
    import { useUIStore } from "@/store/UI/UIStore";
    import { useFilter } from '@/common/composition/useFilter';
    import { usePagination } from '@/common/composition/usePagination';
    import { OptionsFilterDefaults } from '@/types/Character/Options.types';

    export default defineComponent({
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
                type: String,
                default: undefined
            },
            queryBooks: {
                type: Array as PropType<Array<string>>,
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
                dbName: OptionsFilterDefaults.dbName,
                storeKey: props.storeKey,
                url: props.filterUrl || OptionsFilterDefaults.url
            });

            const isCustomized = computed(() => !!props.queryBooks || filter.isCustomized.value);

            const queryParams = computed(() => {
                if (props.queryBooks) {
                    return {
                        ...filter.queryParams.value,
                        book: props.queryBooks
                    };
                }

                return filter.queryParams.value;
            });

            const { initPages, items: options } = usePagination({
                url: '/options',
                limit: -1,
                filter: {
                    isCustomized,
                    value: queryParams
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

                if (options.value.length === 1 && !isMobile.value) {
                    await router.push({ path: options.value[0].url });
                }
            };

            onBeforeMount(async () => {
                await filter.initFilter();
                await initPages();

                if (!isMobile.value && options.value.length && route.name === 'options') {
                    await router.push({ path: options.value[0].url });
                }
            });

            watch(
                () => props.queryBooks,
                initPages,
                {
                    deep: true
                }
            );

            return {
                layout,
                isMobile,
                fullscreen,
                options,
                filter,
                showRightSide: computed(() => route.name === 'optionDetail'),
                initPages,
                onSearch
            };
        }
    });
</script>
