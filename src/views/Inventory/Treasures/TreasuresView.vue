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
        <treasure-item :treasure="treasure" />
      </template>
    </virtual-grouped-list>
  </content-layout>
</template>

<script lang="ts" setup>
  import { storeToRefs } from 'pinia';
  import { computed, onBeforeMount } from 'vue';

  import { useFilter } from '@/shared/composition/useFilter';
  import { usePagination } from '@/shared/composition/usePagination';
  import { getGroupWithIdByFirstLetter } from '@/shared/helpers/list';

  import ContentLayout from '@/components/content/ContentLayout.vue';
  import VirtualGroupedList from '@/components/list/VirtualGroupedList/VirtualGroupedList.vue';

  import { TreasuresFilterDefaults } from '@/types/Inventory/Treasures.d';

  import { useUIStore } from '@/store/UI/UIStore';
  import TreasureItem from '@/views/Inventory/Treasures/TreasureItem.vue';

  const uiStore = useUIStore();

  const { isMobile, fullscreen } = storeToRefs(uiStore);

  const filter = useFilter({
    dbName: TreasuresFilterDefaults.dbName,
    url: TreasuresFilterDefaults.url
  });

  const { initPages, nextPage, isEnd, items } = usePagination({
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
  const treasures = computed(() =>
    items.value.map(item => ({
      ...item,
      id: item.id || `${item.name.eng || item.name.rus} ${item.type.name}`
    }))
  );

  const onSearch = async () => {
    await initPages();
  };

  onBeforeMount(async () => {
    await filter.initFilter();
    await initPages();
  });
</script>
