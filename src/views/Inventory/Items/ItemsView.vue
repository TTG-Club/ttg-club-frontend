<template>
  <content-layout
    :filter-instance="filter"
    :show-right-side="showRightSide"
    title="Снаряжение"
    @search="onSearch"
    @update="initPages"
    @list-end="nextPage"
  >
    <virtual-grid-list
      :list="{ items, keyField: DEFAULT_ENTITY_KEY_FIELD }"
      :flat="showRightSide"
    >
      <template #default="{ item }">
        <item-link
          :item="item"
          :to="{ path: item.url }"
        />
      </template>
    </virtual-grid-list>
  </content-layout>
</template>

<script lang="ts" setup>
  import { storeToRefs } from 'pinia';
  import { computed, onBeforeMount } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useFilter } from '@/common/composition/useFilter';
  import { usePagination } from '@/common/composition/usePagination';
  import ContentLayout from '@/components/content/ContentLayout.vue';
  import VirtualGridList from '@/components/list/VirtualGridList/VirtualGridList.vue';
  import { useUIStore } from '@/store/UI/UIStore';
  import { ItemsFilterDefaults } from '@/types/Inventory/Items.types';
  import ItemLink from '@/views/Inventory/Items/ItemLink.vue';
  import { DEFAULT_ENTITY_KEY_FIELD } from "@/common/const";

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
    limit: 70,
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
