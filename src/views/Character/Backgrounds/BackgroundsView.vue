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

  import { useFilter } from '@/shared/composition/useFilter';
  import { usePagination } from '@/shared/composition/usePagination';
  import { useScrollToPathInList } from '@/shared/composition/useScrollToPathInList';
  import { isAutoOpenAvailable } from '@/shared/helpers/isAutoOpenAvailable';
  import { getGroupByFirstLetter } from '@/shared/helpers/list';

  import ContentLayout from '@/components/content/ContentLayout.vue';
  import { checkIsListGridFlat } from '@/components/list/VirtualGridList/helpers';
  import VirtualGroupedList from '@/components/list/VirtualGroupedList/VirtualGroupedList.vue';
  import { getListProps } from '@/components/list/VirtualList/helpers';

  import { BackgroundsFilterDefaults } from '@/types/Character/Backgrounds.d';

  import { useUIStore } from '@/store/UI/UIStore';
  import BackgroundLink from '@/views/Character/Backgrounds/BackgroundLink.vue';

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const { isMobile, fullscreen } = storeToRefs(uiStore);

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
