<template>
  <content-layout
    :filter-instance="filter"
    :is-end="isEnd"
    :on-load-more="nextPage"
    :show-right-side="showRightSide"
    title="Снаряжение"
    @search="onSearch"
    @update="initPages"
  >
    <virtual-grouped-list
      :get-group="getGroupByFirstLetter"
      :grid="{
        flat: checkIsListGridFlat({ showRightSide, fullscreen }),
        reference: setReference
      }"
      :list="getListProps({ items, size: 'small' })"
    >
      <template #default="{ item }">
        <item-link
          :item="item"
          :to="{ path: item.url }"
        />
      </template>
    </virtual-grouped-list>
  </content-layout>
</template>

<script lang="ts" setup>
  import { storeToRefs } from 'pinia';
  import { computed, onBeforeMount } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import ItemLink from '@/pages/Inventory/Items/ItemLink.vue';

  import { useFilter } from '@/shared/compositions/useFilter';
  import { usePagination } from '@/shared/compositions/usePagination';
  import { useScrollToPathInList } from '@/shared/compositions/useScrollToPathInList';
  import { isAutoOpenAvailable } from '@/shared/helpers/isAutoOpenAvailable';
  import { getGroupByFirstLetter } from '@/shared/helpers/list';
  import { useUIStore } from '@/shared/stores/UIStore';
  import { ItemsFilterDefaults } from '@/shared/types/Inventory/Items.d';
  import ContentLayout from '@/shared/ui/content/ContentLayout.vue';
  import { checkIsListGridFlat } from '@/shared/ui/virtual-views/VirtualGridList/helpers';
  import VirtualGroupedList from '@/shared/ui/virtual-views/VirtualGroupedList/VirtualGroupedList.vue';
  import { getListProps } from '@/shared/ui/virtual-views/VirtualList/helpers';

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const { fullscreen } = storeToRefs(uiStore);

  const filter = useFilter({
    dbName: ItemsFilterDefaults.dbName,
    url: ItemsFilterDefaults.url
  });

  const { initPages, nextPage, isEnd, items } = usePagination({
    url: '/items',
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

    if (isAutoOpenAvailable(items)) {
      await router.push({ path: items.value[0].url });
    }
  };

  onBeforeMount(async () => {
    await filter.initFilter();
    await initPages();
  });

  const showRightSide = computed(() => route.name === 'itemDetail');

  const { setReference } = useScrollToPathInList({
    items,
    showRightSide
  });
</script>
