<template>
  <content-layout
    :filter-instance="filter"
    title="Драгоценности"
    @search="onSearch"
    @update="initPages"
    @list-end="nextPage"
  >
    <virtual-grouped-list
      :list="{ items: treasures }"
      :get-group="getGroupWithIdByFirstLetter"
    >
      <template #default="{ item: treasure }">
        <treasure-item
          :treasure="treasure"
        />
      </template>
    </virtual-grouped-list>
  </content-layout>
</template>

<script lang="ts" setup>
  import { computed, onBeforeMount } from 'vue';
  import { storeToRefs } from 'pinia';
  import ContentLayout from '@/components/content/ContentLayout.vue';
  import TreasureItem from '@/views/Inventory/Treasures/TreasureItem.vue';
  import { useUIStore } from '@/store/UI/UIStore';
  import { useFilter } from '@/common/composition/useFilter';
  import { usePagination } from '@/common/composition/usePagination';
  import { TreasuresFilterDefaults } from '@/types/Inventory/Treasures.types';
  import VirtualGroupedList from '@/components/list/VirtualGroupedList/VirtualGroupedList.vue';
  import { getGroupWithIdByFirstLetter } from "@/common/helpers/list";

  const uiStore = useUIStore();

  const {
    isMobile,
    fullscreen
  } = storeToRefs(uiStore);

  const filter = useFilter({
    dbName: TreasuresFilterDefaults.dbName,
    url: TreasuresFilterDefaults.url
  });

  const {
    initPages,
    nextPage,
    items
  } = usePagination({
    url: '/treasures',
    limit: 120,
    filter: {
      isCustomized: filter.isCustomized,
      value: filter.queryParams
    },
    search: filter.search,
    order: [
      {
        field: 'cost',
        direction: 'asc'
      },
      {
        field: 'name',
        direction: 'asc'
      }
    ]
  });

  /* Для добавления идентификатора к элементам */
  const treasures = computed(() => items.value.map(item => ({
    ...item,
    id: item.id || `${ item.name.eng || item.name.rus } ${ item.type.name }`
  })));

  const onSearch = async () => {
    await initPages();
  };

  onBeforeMount(async () => {
    await filter.initFilter();
    await initPages();
  });
</script>
