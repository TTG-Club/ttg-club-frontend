<script lang="ts" setup>
  import { capitalize } from 'lodash-es';

  import { useFilter } from '@/shared/composable/useFilter';
  import { usePagination } from '@/shared/composable/usePagination';
  import { useScrollToPathInList } from '@/shared/composable/useScrollToPathInList';
  import { DEFAULT_ENTITY_KEY_FIELD } from '@/shared/const';
  import { useUIStore } from '@/shared/stores/UIStore';
  import type { AnyObject } from '@/shared/types/Utility';
  import { GodsFilterDefaults } from '@/shared/types/wiki/Gods.d';
  import { checkIsListGridFlat } from '@/shared/ui/virtual-views/VirtualGridList/helpers';
  import VirtualGroupedList from '@/shared/ui/virtual-views/VirtualGroupedList/VirtualGroupedList.vue';
  import { getListProps } from '@/shared/ui/virtual-views/VirtualList/helpers';
  import { isAutoOpenAvailable } from '@/shared/utils/isAutoOpenAvailable';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  import GodLink from '@/pages/wiki/gods/GodLink.vue';

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const { fullscreen } = storeToRefs(uiStore);

  const filter = useFilter({
    dbName: GodsFilterDefaults.dbName,
    url: GodsFilterDefaults.url,
  });

  const {
    initPages,
    nextPage,
    isEnd,
    items: gods,
  } = usePagination({
    url: '/gods',
    filter: {
      isCustomized: filter.isCustomized,
      value: filter.queryParams,
    },
    search: filter.search,
    order: [
      {
        field: 'aligment',
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

    if (isAutoOpenAvailable(gods)) {
      await router.push({ path: gods.value[0].url });
    }
  };

  const getGroupByAlignment = (god: AnyObject) => ({
    [DEFAULT_ENTITY_KEY_FIELD]: god.alignment,
    name: capitalize(String(god.alignment)),
  });

  onBeforeMount(async () => {
    await filter.initFilter();
    await initPages();
  });

  const showRightSide = computed(() => route.name === 'godDetail');

  const { setReference } = useScrollToPathInList({
    items: gods,
    showRightSide,
  });
</script>

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
        reference: setReference,
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
