<script lang="ts" setup>
  import { useFilter } from '@/shared/composable/useFilter';
  import { usePagination } from '@/shared/composable/usePagination';
  import { TreasuresFilterDefaults } from '@/shared/types/inventory/Treasures.d';
  import VirtualGroupedList from '@/shared/ui/virtual-views/VirtualGroupedList/VirtualGroupedList.vue';
  import { getGroupWithIdByFirstLetter } from '@/shared/utils/list';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  import TreasureItem from '@/pages/inventory/treasures/TreasureItem.vue';

  const filter = useFilter({
    dbName: TreasuresFilterDefaults.dbName,
    url: TreasuresFilterDefaults.url,
  });

  const { initPages, nextPage, isEnd, items } = usePagination({
    url: '/treasures',
    filter: {
      isCustomized: filter.isCustomized,
      value: filter.queryParams,
    },
    search: filter.search,
    order: [
      {
        field: 'cost',
        direction: 'asc',
      },
      {
        field: 'name',
        direction: 'asc',
      },
    ],
  });

  /* Для добавления идентификатора к элементам */
  const treasures = computed(() =>
    items.value.map((item) => ({
      ...item,
      id: item.id || `${item.name.eng || item.name.rus} ${item.type.name}`,
    })),
  );

  const onSearch = async () => {
    await initPages();
  };

  onBeforeMount(async () => {
    await filter.initFilter();
    await initPages();
  });
</script>

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
