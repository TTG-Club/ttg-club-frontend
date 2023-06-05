<template>
  <content-layout
    :filter-instance="filter"
    :is-end="isEnd"
    :on-load-more="nextPage"
    title="Драгоценности"
    @search="onSearch"
    @update="initPages"
  >
    <virtual-grouped-list
      :get-group="getGroupWithIdByFirstLetter"
      :list="{ items: treasures }"
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
  import { getGroupWithIdByFirstLetter } from '@/common/helpers/list';

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
    isEnd,
    items
  } = usePagination({
    url: '/treasures',
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
  const treasures = computed(() => items.value.map(item => (
    {
      ...item,
      id: item.id || `${ item.name.eng || item.name.rus } ${ item.type.name }`
    }
  )));

  const onSearch = async () => {
    await initPages();
  };

  onBeforeMount(async () => {
    await filter.initFilter();
    await initPages();
  });
</script>
