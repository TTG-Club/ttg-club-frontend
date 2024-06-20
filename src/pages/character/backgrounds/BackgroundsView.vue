<script lang="ts" setup>
  import { storeToRefs } from 'pinia';
  import { computed, onBeforeMount } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { useFilter } from '@/shared/composable/useFilter';
  import { usePagination } from '@/shared/composable/usePagination';
  import { useScrollToPathInList } from '@/shared/composable/useScrollToPathInList';
  import { useUIStore } from '@/shared/stores/UIStore';
  import { BackgroundsFilterDefaults } from '@/shared/types/character/Backgrounds.d';
  import { checkIsListGridFlat } from '@/shared/ui/virtual-views/VirtualGridList/helpers';
  import VirtualGroupedList from '@/shared/ui/virtual-views/VirtualGroupedList/VirtualGroupedList.vue';
  import { getListProps } from '@/shared/ui/virtual-views/VirtualList/helpers';
  import { isAutoOpenAvailable } from '@/shared/utils/isAutoOpenAvailable';
  import { getGroupByFirstLetter } from '@/shared/utils/list';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  import BackgroundLink from './BackgroundLink.vue';

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const { fullscreen } = storeToRefs(uiStore);

  const filter = useFilter({
    dbName: BackgroundsFilterDefaults.dbName,
    url: BackgroundsFilterDefaults.url,
  });

  const { initPages, items: backgrounds } = usePagination({
    url: '/backgrounds',
    size: -1,
    filter: {
      isCustomized: filter.isCustomized,
      value: filter.queryParams,
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

    if (isAutoOpenAvailable(backgrounds)) {
      await router.push({ path: backgrounds.value[0].url });
    }
  };

  onBeforeMount(async () => {
    await filter.initFilter();
    await initPages();
  });

  const showRightSide = computed(() => route.name === 'backgroundDetail');

  const { setReference } = useScrollToPathInList({
    items: backgrounds,
    showRightSide,
  });
</script>

<template>
  <content-layout
    :filter-instance="filter"
    :show-right-side="showRightSide"
    title="Предыстории"
    @search="onSearch"
    @update="initPages"
  >
    <virtual-grouped-list
      :list="getListProps({ items: backgrounds, size: 'small' })"
      :get-group="getGroupByFirstLetter"
      :grid="{
        flat: checkIsListGridFlat({ showRightSide, fullscreen }),
        reference: setReference,
      }"
    >
      <template #default="{ item: background }">
        <background-link
          :background-item="background"
          :to="{ path: background.url }"
        />
      </template>
    </virtual-grouped-list>
  </content-layout>
</template>
