<template>
  <content-layout
    :filter-instance="filter"
    :show-right-side="showRightSide"
    title="Снаряжение"
    @search="onSearch"
    @update="initPages"
    @list-end="nextPage"
  >
    <virtual-grouped-list
      :list="getListProps({ items })"
      :get-group="getGroupByFirstLetter"
      :grid="{ flat: showRightSide }"
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
  import { useFilter } from '@/common/composition/useFilter';
  import { usePagination } from '@/common/composition/usePagination';
  import ContentLayout from '@/components/content/ContentLayout.vue';
  import { useUIStore } from '@/store/UI/UIStore';
  import { ItemsFilterDefaults } from '@/types/Inventory/Items.types';
  import ItemLink from '@/views/Inventory/Items/ItemLink.vue';
  import { DEFAULT_PAGINATION_ITEMS_LIMIT } from "@/common/const";
  import VirtualGroupedList from "@/components/list/VirtualGroupedList/VirtualGroupedList.vue";
  import { getGroupByFirstLetter } from "@/common/helpers/list";
  import { getListProps } from "@/components/list/VirtualList/helpers";

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const {
    isMobile,
    fullscreen
  } = storeToRefs(uiStore);

  const filter = useFilter({
    dbName: ItemsFilterDefaults.dbName,
    url: ItemsFilterDefaults.url
  });

  const {
    initPages,
    nextPage,
    items
  } = usePagination({
    url: '/items',
    limit: DEFAULT_PAGINATION_ITEMS_LIMIT,
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

    if (items.value.length === 1 && !isMobile.value) {
      await router.push({ path: items.value[0].url });
    }
  };

  onBeforeMount(async () => {
    await filter.initFilter();
    await initPages();
  });

  const showRightSide = computed(() => route.name === 'itemDetail');
</script>
