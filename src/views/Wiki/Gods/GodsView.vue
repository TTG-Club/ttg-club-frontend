<template>
  <content-layout
    :filter-instance="filter"
    :is-end="isEnd"
    :on-load-more="nextPage"
    :show-right-side="showRightSide"
    title="Боги"
    @search="onSearch"
    @update="initPages"
  >
    <virtual-grouped-list
      :get-group="getGroupByAlignment"
      :grid="{
        flat: checkIsListGridFlat({ showRightSide, fullscreen }),
        reference: setReference
      }"
      :list="getListProps({ items: gods, size: 'medium' })"
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
  import capitalize from 'lodash/capitalize';
  import { storeToRefs } from 'pinia';
  import { computed, onBeforeMount } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { useFilter } from '@/shared/composition/useFilter';
  import { usePagination } from '@/shared/composition/usePagination';
  import { useScrollToPathInList } from '@/shared/composition/useScrollToPathInList';
  import { DEFAULT_ENTITY_KEY_FIELD } from '@/shared/const';
  import { isAutoOpenAvailable } from '@/shared/helpers/isAutoOpenAvailable';
  import type { AnyObject } from '@/shared/types/Utility';

  import ContentLayout from '@/components/content/ContentLayout.vue';
  import { checkIsListGridFlat } from '@/components/list/VirtualGridList/helpers';
  import VirtualGroupedList from '@/components/list/VirtualGroupedList/VirtualGroupedList.vue';
  import { getListProps } from '@/components/list/VirtualList/helpers';

  import { GodsFilterDefaults } from '@/types/Wiki/Gods.d';

  import { useUIStore } from '@/store/UI/UIStore';
  import GodLink from '@/views/Wiki/Gods/GodLink.vue';

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const { isMobile, fullscreen } = storeToRefs(uiStore);

  const filter = useFilter({
    dbName: GodsFilterDefaults.dbName,
    url: GodsFilterDefaults.url
  });

  const {
    initPages,
    nextPage,
    isEnd,
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

  const { setReference } = useScrollToPathInList({
    items: gods,
    showRightSide
  });
</script>
