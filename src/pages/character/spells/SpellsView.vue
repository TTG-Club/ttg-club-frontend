<script lang="ts" setup>
  import { toValue } from '@vueuse/shared';
  import { storeToRefs } from 'pinia';
  import { computed, onBeforeMount, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { useFilter } from '@/shared/composable/useFilter';
  import { usePagination } from '@/shared/composable/usePagination';
  import { useScrollToPathInList } from '@/shared/composable/useScrollToPathInList';
  import { useUIStore } from '@/shared/stores/UIStore';
  import {
    SpellsFilterDefaults,
    type TSpellLink,
  } from '@/shared/types/character/Spells.d';
  import type { AnyObject } from '@/shared/types/Utility';
  import { getListGridInTabProps } from '@/shared/ui/virtual-views/VirtualGridList/helpers';
  import VirtualGroupedList from '@/shared/ui/virtual-views/VirtualGroupedList/VirtualGroupedList.vue';
  import { getListProps } from '@/shared/ui/virtual-views/VirtualList/helpers';
  import { isAutoOpenAvailable } from '@/shared/utils/isAutoOpenAvailable';

  import ContentLayout from '@/layouts/ContentLayout.vue';
  import TabLayout from '@/layouts/TabLayout.vue';

  import SpellLink from '@/pages/character/spells/SpellLink.vue';

  const props = withDefaults(
    defineProps<{
      inTab?: boolean;
      storeKey?: string;
      filterUrl?: string;
      queryBooks?: Array<string>;
    }>(),
    {
      inTab: false,
      storeKey: '',
      filterUrl: '',
      queryBooks: undefined,
    },
  );

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const { fullscreen } = storeToRefs(uiStore);

  const layout = computed(() => (props.inTab ? TabLayout : ContentLayout));

  const filter = useFilter({
    dbName: SpellsFilterDefaults.dbName,
    storeKey: computed(() => props.storeKey),
    url: computed(() => props.filterUrl || SpellsFilterDefaults.url),
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
    items: spells,
  } = usePagination<TSpellLink[]>({
    url: '/spells',
    filter: {
      isCustomized,
      value: queryParams,
    },
    search: filter.search,
    order: [
      {
        field: 'level',
        direction: 'asc',
      },
      {
        field: 'name',
        direction: 'asc',
      },
    ],
  });

  const onSearch = async () => {
    await initPages();

    if (isAutoOpenAvailable(spells, props.inTab)) {
      await router.push({ path: spells.value[0].url });
    }
  };

  onBeforeMount(async () => {
    await filter.initFilter();
    await initPages();
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

  /* TODO: Добавить тип заклинания */
  const getSpellGroup = ({ level }: AnyObject) => ({
    url: `${level}`,
    name: level ? `${level} уровень` : 'Заговоры',
    order: level,
  });

  const showRightSide = computed(() => route.name === 'spellDetail');

  const { setReference } = useScrollToPathInList({
    items: spells,
    disabled: props.inTab,
    showRightSide,
  });

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
    title="Заклинания"
    @search="onSearch"
    @update="initPages"
  >
    <virtual-grouped-list
      :get-group="getSpellGroup"
      :grid="grid"
      :list="getListProps({ items: spells })"
    >
      <template #default="{ item: spell }">
        <spell-link
          :in-tab="inTab"
          :spell="spell"
          :to="{ path: spell.url }"
        />
      </template>
    </virtual-grouped-list>
  </component>
</template>
