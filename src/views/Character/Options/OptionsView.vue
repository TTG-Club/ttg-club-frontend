<template>
  <component
    :is="layout"
    :filter-instance="filter"
    :is-end="isEnd"
    :on-load-more="nextPage"
    :show-right-side="showRightSide"
    title="Особенности классов"
    @search="onSearch"
    @update="initPages"
  >
    <virtual-grouped-list
      :get-group="getGroupByFirstLetter"
      :grid="grid"
      :list="getListProps({ items: options })"
    >
      <template #default="{ item: option }">
        <option-link
          :in-tab="inTab"
          :option-item="option"
          :to="{ path: option.url }"
        />
      </template>
    </virtual-grouped-list>
  </component>
</template>

<script lang="ts" setup>
  import {
    computed, onBeforeMount, watch
  } from 'vue';
  import { storeToRefs } from 'pinia';
  import { useRoute, useRouter } from 'vue-router';
  import { toValue } from '@vueuse/shared';
  import ContentLayout from '@/components/content/ContentLayout.vue';
  import TabLayout from '@/components/content/TabLayout.vue';
  import OptionLink from '@/views/Character/Options/OptionLink.vue';
  import { useUIStore } from '@/store/UI/UIStore';
  import { useFilter } from '@/common/composition/useFilter';
  import { usePagination } from '@/common/composition/usePagination';
  import { OptionsFilterDefaults } from '@/types/Character/Options.types';
  import VirtualGroupedList from '@/components/list/VirtualGroupedList/VirtualGroupedList.vue';
  import { getGroupByFirstLetter } from '@/common/helpers/list';
  import { getListProps } from '@/components/list/VirtualList/helpers';
  import { getListGridInTabProps } from '@/components/list/VirtualGridList/helpers';
  import { isAutoOpenAvailable } from '@/common/helpers/isAutoOpenAvailable';

  type TProps = {
    inTab?: boolean;
    storeKey?: string;
    filterUrl?: string;
    queryBooks?: Array<string>;
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
    const params = toValue(filter.queryParams);

    if (params?.book instanceof Array) {
      return filter.queryParams.value;
    }

    return {
      ...params,
      book: props.queryBooks
    };
  });

  const {
    initPages,
    nextPage,
    resetPages,
    isEnd,
    items: options
  } = usePagination({
    url: '/options',
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

    if (isAutoOpenAvailable(options, props.inTab)) {
      await router.push({ path: options.value[0].url });
    }
  };

  onBeforeMount(async () => {
    await filter.initFilter();
    await initPages();
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

  const grid = computed(() => getListGridInTabProps({
    showRightSide: showRightSide.value,
    fullscreen: fullscreen.value,
    inTab: props.inTab
  }));
</script>
