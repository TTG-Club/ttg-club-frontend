<script lang="ts" setup>
  import { capitalize } from 'lodash-es';

  import { useFilter } from '@/shared/composable/useFilter';
  import { usePagination } from '@/shared/composable/usePagination';
  import { useScrollToPathInList } from '@/shared/composable/useScrollToPathInList';
  import { useUIStore } from '@/shared/stores/UIStore';
  import { MagicItemsFilterDefaults } from '@/shared/types/inventory/MagicItems.d';
  import type { AnyObject } from '@/shared/types/Utility';
  import { checkIsListGridFlat } from '@/shared/ui/virtual-views/VirtualGridList/helpers';
  import VirtualGroupedList from '@/shared/ui/virtual-views/VirtualGroupedList/VirtualGroupedList.vue';
  import { getListProps } from '@/shared/ui/virtual-views/VirtualList/helpers';
  import { isAutoOpenAvailable } from '@/shared/utils/isAutoOpenAvailable';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  import MagicItemLink from '@/pages/inventory/magic-items/MagicItemLink.vue';

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const { fullscreen } = storeToRefs(uiStore);

  const filter = useFilter({
    dbName: MagicItemsFilterDefaults.dbName,
    url: MagicItemsFilterDefaults.url,
  });

  const { initPages, nextPage, isEnd, items } = usePagination({
    url: '/items/magic',
    filter: {
      isCustomized: filter.isCustomized,
      value: filter.queryParams,
    },
    search: filter.search,
    order: [
      {
        field: 'rarity',
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

    if (isAutoOpenAvailable(items)) {
      await router.push({ path: items.value[0].url });
    }
  };

  const getGroupByRarity = (item: AnyObject & { rarity: AnyObject }) => ({
    url: item.rarity.type,
    name: capitalize(String(item.rarity.name)),
  });

  onBeforeMount(async () => {
    await filter.initFilter();
    await initPages();
  });

  const showRightSide = computed(() => route.name === 'magicItemDetail');

  const { setReference } = useScrollToPathInList({
    items,
    showRightSide,
  });
</script>

<template>
  <content-layout
    :filter-instance="filter"
    :is-end="isEnd"
    :on-load-more="nextPage"
    :show-right-side="showRightSide"
    title="Магические предметы"
    @search="onSearch"
    @update="initPages"
  >
    <virtual-grouped-list
      :get-group="getGroupByRarity"
      :grid="{
        flat: checkIsListGridFlat({ showRightSide, fullscreen }),
        reference: setReference,
      }"
      :list="getListProps({ items })"
    >
      <template #default="{ item }">
        <magic-item-link
          :magic-item="item"
          :to="{ path: item.url }"
        />
      </template>
    </virtual-grouped-list>
  </content-layout>
</template>
