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
        reference: setReference
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

<script lang="ts" setup>
  import capitalize from 'lodash/capitalize';
  import { storeToRefs } from 'pinia';
  import { computed, onBeforeMount } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { useFilter } from '@/shared/composition/useFilter';
  import { usePagination } from '@/shared/composition/usePagination';
  import { useScrollToPathInList } from '@/shared/composition/useScrollToPathInList';
  import { isAutoOpenAvailable } from '@/shared/helpers/isAutoOpenAvailable';
  import type { AnyObject } from '@/shared/types/Utility';

  import ContentLayout from '@/components/content/ContentLayout.vue';
  import { checkIsListGridFlat } from '@/components/list/VirtualGridList/helpers';
  import VirtualGroupedList from '@/components/list/VirtualGroupedList/VirtualGroupedList.vue';
  import { getListProps } from '@/components/list/VirtualList/helpers';

  import { MagicItemsFilterDefaults } from '@/types/Inventory/MagicItems.d';

  import { useUIStore } from '@/store/UI/UIStore';
  import MagicItemLink from '@/views/Inventory/MagicItems/MagicItemLink.vue';

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const { isMobile, fullscreen } = storeToRefs(uiStore);

  const filter = useFilter({
    dbName: MagicItemsFilterDefaults.dbName,
    url: MagicItemsFilterDefaults.url
  });

  const { initPages, nextPage, isEnd, items } = usePagination({
    url: '/items/magic',
    filter: {
      isCustomized: filter.isCustomized,
      value: filter.queryParams
    },
    search: filter.search,
    order: [
      {
        field: 'rarity',
        direction: 'asc'
      },
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

  const getGroupByRarity = (item: AnyObject & { rarity: AnyObject }) => ({
    url: item.rarity.type,
    name: capitalize(String(item.rarity.name))
  });

  onBeforeMount(async () => {
    await filter.initFilter();
    await initPages();
  });

  const showRightSide = computed(() => route.name === 'magicItemDetail');

  const { setReference } = useScrollToPathInList({
    items,
    showRightSide
  });
</script>
