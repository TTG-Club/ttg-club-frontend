<template>
  <content-layout
    :filter-instance="filter"
    :show-right-side="showRightSide"
    title="Магические предметы"
    @search="onSearch"
    @update="initPages"
    @list-end="nextPage"
  >
    <virtual-grouped-list
      :list="{ items, keyField: DEFAULT_ENTITY_KEY_FIELD }"
      :get-group="getGroupByRarity"
      :grid="{ flat: showRightSide }"
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
  import { storeToRefs } from 'pinia';
  import { computed, onBeforeMount } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import capitalize from "lodash/capitalize";
  import { useFilter } from '@/common/composition/useFilter';
  import { usePagination } from '@/common/composition/usePagination';
  import ContentLayout from '@/components/content/ContentLayout.vue';
  import { useUIStore } from '@/store/UI/UIStore';
  import { MagicItemsFilterDefaults } from '@/types/Inventory/MagicItems.types';
  import MagicItemLink from '@/views/Inventory/MagicItems/MagicItemLink.vue';
  import { DEFAULT_ENTITY_KEY_FIELD } from "@/common/const";
  import VirtualGroupedList from "@/components/list/VirtualGroupedList/VirtualGroupedList.vue";
  import type { AnyObject } from "@/types/Shared/Utility.types";

  const route = useRoute;
  const router = useRouter();
  const uiStore = useUIStore();

  const {
    isMobile,
    fullscreen
  } = storeToRefs(uiStore);

  const filter = useFilter({
    dbName: MagicItemsFilterDefaults.dbName,
    url: MagicItemsFilterDefaults.url
  });

  const {
    initPages,
    nextPage,
    items
  } = usePagination({
    url: '/items/magic',
    limit: 120,
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

    if (items.value.length === 1 && !isMobile.value) {
      await router.push({ path: items.value[0].url });
    }
  };

  const getGroupByRarity = (item: AnyObject & {rarity: AnyObject}) => ({
    url: item.rarity.type,
    name: capitalize(String(item.rarity.name))
  });

  onBeforeMount(async () => {
    await filter.initFilter();
    await initPages();
  });

  const showRightSide = computed(() => route.name === 'magicItemDetail');
</script>
