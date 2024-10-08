<script lang="ts" setup>
  import { toValue } from '@vueuse/shared';

  import { useFilter } from '@/shared/composable/useFilter';
  import { usePagination } from '@/shared/composable/usePagination';
  import { useScrollToPathInList } from '@/shared/composable/useScrollToPathInList';
  import { useUIStore } from '@/shared/stores/UIStore';
  import { OptionsFilterDefaults } from '@/shared/types/character/Options.d';
  import { getListGridInTabProps } from '@/shared/ui/virtual-views/VirtualGridList/helpers';
  import VirtualGroupedList from '@/shared/ui/virtual-views/VirtualGroupedList/VirtualGroupedList.vue';
  import { getListProps } from '@/shared/ui/virtual-views/VirtualList/helpers';
  import { isAutoOpenAvailable } from '@/shared/utils/isAutoOpenAvailable';
  import { getGroupByFirstLetter } from '@/shared/utils/list';

  import ContentLayout from '@/layouts/ContentLayout.vue';
  import TabLayout from '@/layouts/TabLayout.vue';

  import OptionLink from '@/pages/character/options/OptionLink.vue';

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
    queryBooks: undefined,
  });

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const { fullscreen } = storeToRefs(uiStore);

  const layout = computed(() => (props.inTab ? TabLayout : ContentLayout));

  const filter = useFilter({
    dbName: OptionsFilterDefaults.dbName,
    storeKey: computed(() => props.storeKey),
    url: computed(() => props.filterUrl || OptionsFilterDefaults.url),
  });

  const isCustomized = computed(
    () => !!props.queryBooks || filter.isCustomized.value,
  );

  const queryParams = computed(() => {
    const params = toValue(filter.queryParams);

    if (params?.book instanceof Array) {
      return filter.queryParams.value;
    }

    return {
      ...params,
      book: props.queryBooks,
    };
  });

  const {
    initPages,
    nextPage,
    resetPages,
    isEnd,
    items: options,
  } = usePagination({
    url: '/options',
    filter: {
      isCustomized,
      value: queryParams,
    },
    search: filter.search,
    order: [
      {
        field: 'name',
        direction: 'asc',
      },
    ],
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

  const { setReference } = useScrollToPathInList({
    items: options,
    disabled: props.inTab,
  });

  watch(
    [() => props.queryBooks, () => props.filterUrl, () => props.storeKey],
    async () => {
      await resetPages();
      await filter.initFilter();
      await initPages();
    },
    {
      deep: true,
    },
  );

  const showRightSide = computed(() => route.name === 'optionDetail');

  const grid = computed(() => ({
    ...getListGridInTabProps({
      showRightSide: showRightSide.value,
      fullscreen: fullscreen.value,
      inTab: props.inTab,
    }),
    reference: setReference,
  }));
</script>

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
      :list="getListProps({ items: options, size: 'small' })"
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
