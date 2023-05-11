<template>
    <component
        :is="layout"
        title="Особенности классов"
        :filter-instance="filter"
        :show-right-side="showRightSide"
        @search="onSearch"
        @update="initPages"
        @list-end="nextPage"
    >
        <virtual-grid-list
            :list="{ items: options, keyField: 'url' }"
            :flat="showRightSide"
        >
            <template #default="{ item: option }">
                <option-link
                    :in-tab="inTab"
                    :option-item="option"
                    :to="{ path: option.url }"
                />
            </template>
        </virtual-grid-list>
    </component>
</template>

<script lang="ts" setup>
    import {
        computed, onBeforeMount, watch
    } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useRoute, useRouter } from 'vue-router';
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import TabLayout from '@/components/content/TabLayout.vue';
    import OptionLink from '@/views/Character/Options/OptionLink.vue';
    import { useUIStore } from '@/store/UI/UIStore';
    import { useFilter } from '@/common/composition/useFilter';
    import { usePagination } from '@/common/composition/usePagination';
    import { OptionsFilterDefaults } from '@/types/Character/Options.types';
    import VirtualGridList from "@/components/list/VirtualGridList/VirtualGridList.vue";

    type TProps = {
        inTab?: boolean,
        storeKey?: string,
        filterUrl?: string,
        queryBooks?: string[],
    };

    const props = withDefaults(defineProps<TProps>(), {
        inTab: false,
        storeKey: '',
        filterUrl: undefined,
        queryBooks: undefined
    });

    const route = useRoute();
    const router = useRouter();
    const uiStore = useUIStore();

    const {
        isMobile,
        fullscreen
    } = storeToRefs(uiStore);

    const layout = computed(() => (
        props.inTab
            ? TabLayout
            : ContentLayout
    ));

    const filter = useFilter({
        dbName: OptionsFilterDefaults.dbName,
        storeKey: computed(() => props.storeKey),
        url: computed(() => props.filterUrl || OptionsFilterDefaults.url)
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

    const {
        initPages,
        nextPage,
        resetPages,
        items: options
    } = usePagination({
        url: '/options',
        limit: 70,
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

        if (options.value.length === 1 && !isMobile.value && !props.inTab) {
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
        [
            () => props.queryBooks,
            () => props.filterUrl,
            () => props.storeKey
        ],
        async () => {
            await resetPages();
            await filter.initFilter();
            await initPages();
        },
        {
            deep: true
        }
    );

    const showRightSide = computed(() => route.name === 'optionDetail');
</script>
