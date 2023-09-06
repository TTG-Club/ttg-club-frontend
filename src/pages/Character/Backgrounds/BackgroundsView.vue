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
        reference: setReference
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

<script lang="ts" setup>
  import { storeToRefs } from 'pinia';
  import { computed, onBeforeMount } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import BackgroundLink from '@/pages/Character/Backgrounds/BackgroundLink.vue';

  import { useFilter } from '@/shared/compositions/useFilter';
  import { usePagination } from '@/shared/compositions/usePagination';
  import { useScrollToPathInList } from '@/shared/compositions/useScrollToPathInList';
  import { isAutoOpenAvailable } from '@/shared/helpers/isAutoOpenAvailable';
  import { getGroupByFirstLetter } from '@/shared/helpers/list';
  import { useUIStore } from '@/shared/stores/UIStore';
  import { BackgroundsFilterDefaults } from '@/shared/types/Character/Backgrounds.d';
  import ContentLayout from '@/shared/ui/content/ContentLayout.vue';
  import { checkIsListGridFlat } from '@/shared/ui/virtual-views/VirtualGridList/helpers';
  import VirtualGroupedList from '@/shared/ui/virtual-views/VirtualGroupedList/VirtualGroupedList.vue';
  import { getListProps } from '@/shared/ui/virtual-views/VirtualList/helpers';

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const { fullscreen } = storeToRefs(uiStore);

  const filter = useFilter({
    dbName: BackgroundsFilterDefaults.dbName,
    url: BackgroundsFilterDefaults.url
  });

  const { initPages, items: backgrounds } = usePagination({
    url: '/backgrounds',
    limit: -1,
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
    showRightSide
  });
</script>
