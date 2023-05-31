<template>
  <content-layout
    :filter-instance="filter"
    :show-right-side="showRightSide"
    title="Боги"
    @search="onSearch"
    @update="initPages"
    @list-end="nextPage"
  >
    <virtual-grouped-list
      :list="getListProps({ items: gods })"
      :get-group="getGroupByAlignment"
      :grid="{ flat: checkIsListGridFlat({ showRightSide, fullscreen }) }"
    >
      <template #default="{ item: god }">
        <god-link
          :god="god"
          :to="{ path: god.url }"
        />
      </template>
    </virtual-grouped-list>
  </content-layout>
</template>

<script lang="ts" setup>
  import { computed, onBeforeMount } from 'vue';
  import { storeToRefs } from 'pinia';
  import { useRoute, useRouter } from 'vue-router';
  import capitalize from 'lodash/capitalize';
  import ContentLayout from '@/components/content/ContentLayout.vue';
  import GodLink from '@/views/Wiki/Gods/GodLink.vue';
  import { useUIStore } from '@/store/UI/UIStore';
  import { GodsFilterDefaults } from '@/types/Wiki/Gods.types';
  import { useFilter } from '@/common/composition/useFilter';
  import { usePagination } from '@/common/composition/usePagination';
  import { DEFAULT_ENTITY_KEY_FIELD } from '@/common/const';
  import VirtualGroupedList from '@/components/list/VirtualGroupedList/VirtualGroupedList.vue';
  import type { AnyObject } from '@/types/Shared/Utility.types';
  import { getListProps } from '@/components/list/VirtualList/helpers';
  import { checkIsListGridFlat } from '@/components/list/VirtualGridList/helpers';
  import { isAutoOpenAvailable } from '@/common/helpers/isAutoOpenAvailable';

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
    filter: {
      isCustomized: filter.isCustomized,
      value: filter.queryParams
    },
    search: filter.search,
    order: [
      {
        field: 'aligment',
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

    if (isAutoOpenAvailable(gods)) {
      await router.push({ path: gods.value[0].url });
    }
  };

  const getGroupByAlignment = (god: AnyObject) => ({
    [DEFAULT_ENTITY_KEY_FIELD]: god.alignment,
    name: capitalize(String(god.alignment))
  });

  onBeforeMount(async () => {
    await filter.initFilter();
    await initPages();
  });

  const showRightSide = computed(() => route.name === 'godDetail');
</script>
