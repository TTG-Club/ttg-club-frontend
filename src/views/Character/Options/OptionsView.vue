<template>
  <component
    :is="layout"
    :filter-instance="filter"
    :show-right-side="showRightSide"
    title="Особенности классов"
    @search="onSearch"
    @update="initPages"
    @list-end="nextPage"
  >
    <virtual-grouped-list
      :list="getListProps({ items: options })"
      :grid="{ flat: checkIsListGridFlat({ showRightSide, fullscreen }) }"
      :get-group="getGroupByFirstLetter"
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
    computed, onBeforeMount, watch, unref
  } from 'vue';
  import { storeToRefs } from 'pinia';
  import { useRoute, useRouter } from 'vue-router';
  import { computedInject } from '@vueuse/core';
  import ContentLayout from '@/components/content/ContentLayout.vue';
  import TabLayout from '@/components/content/TabLayout.vue';
  import OptionLink from '@/views/Character/Options/OptionLink.vue';
  import { useUIStore } from '@/store/UI/UIStore';
  import { useFilter } from '@/common/composition/useFilter';
  import { usePagination } from '@/common/composition/usePagination';
  import { OptionsFilterDefaults } from '@/types/Character/Options.types';
  import VirtualGroupedList from '@/components/list/VirtualGroupedList/VirtualGroupedList.vue';
  import { getGroupByFirstLetter } from "@/common/helpers/list";
  import { getListProps } from "@/components/list/VirtualList/helpers";
  import { checkIsListGridFlat } from "@/components/list/VirtualGridList/helpers";
  import { isAutoOpenAvailable } from '@/common/helpers/isAutoOpenAvailable';

  type TProps = {
    inTab?: boolean,
    storeKey?: string,
    filterUrl?: string,
  };

  const props = withDefaults(defineProps<TProps>(), {
    inTab: false,
    storeKey: '',
    filterUrl: undefined
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

  const queryBooks = computedInject<Array<string>>('queryBooks', source => {
    if (unref(source) instanceof Array) {
      return unref(source);
    }

    return [];
  });

  const isCustomized = computed(() => !!queryBooks.value.length || filter.isCustomized.value);

  const queryParams = computed(() => {
    const params = unref(filter.queryParams);

    if (params?.book instanceof Array) {
      return filter.queryParams.value;
    }

    return {
      ...params,
      book: queryBooks.value
    };
  });

  const {
    initPages,
    nextPage,
    resetPages,
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
      queryBooks,
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
