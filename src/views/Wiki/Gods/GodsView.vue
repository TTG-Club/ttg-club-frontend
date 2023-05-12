<template>
  <content-layout
    :filter-instance="filter"
    :show-right-side="showRightSide"
    title="Боги"
    @search="onSearch"
    @update="initPages"
    @list-end="nextPage"
  >
    <virtual-grid-list
      :flat="showRightSide"
      :list="{
        items: gods,
        keyField: DEFAULT_ENTITY_KEY_FIELD,
      }"
    >
      <template #default="{ item: god }">
        <god-link
          :god="god"
          :to="{ path: god.url }"
        />
      </template>
    </virtual-grid-list>
  </content-layout>
</template>

<script lang="ts" setup>
  import { computed, onBeforeMount } from 'vue';
  import { storeToRefs } from 'pinia';
  import { useRoute, useRouter } from 'vue-router';
  import ContentLayout from '@/components/content/ContentLayout.vue';
  import GodLink from '@/views/Wiki/Gods/GodLink.vue';
  import { useUIStore } from '@/store/UI/UIStore';
  import { GodsFilterDefaults } from '@/types/Wiki/Gods.types';
  import { useFilter } from '@/common/composition/useFilter';
  import { usePagination } from '@/common/composition/usePagination';
  import VirtualGridList from '@/components/list/VirtualGridList/VirtualGridList.vue';
  import { DEFAULT_ENTITY_KEY_FIELD } from "@/common/const";

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const {
    isMobile,
    fullscreen
  } = storeToRefs(uiStore);

  const filter = useFilter({
    dbName: GodsFilterDefaults.dbName,
    url: GodsFilterDefaults.url
  });

  const {
    initPages,
    nextPage,
    items: gods
  } = usePagination({
    url: '/gods',
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

    if (gods.value.length === 1 && !isMobile.value) {
      await router.push({ path: gods.value[0].url });
    }
  };

  onBeforeMount(async () => {
    await filter.initFilter();
    await initPages();
  });

  const showRightSide = computed(() => route.name === 'godDetail');
</script>
