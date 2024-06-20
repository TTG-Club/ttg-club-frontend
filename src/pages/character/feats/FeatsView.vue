<script lang="ts" setup>
  import { storeToRefs } from 'pinia';
  import { computed, onBeforeMount } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { useFilter } from '@/shared/composable/useFilter';
  import { usePagination } from '@/shared/composable/usePagination';
  import { useScrollToPathInList } from '@/shared/composable/useScrollToPathInList';
  import { useUIStore } from '@/shared/stores/UIStore';
  import {
    FeatsFilterDefaults,
    type FeatsLinkItem,
  } from '@/shared/types/character/Feats.d';
  import { checkIsListGridFlat } from '@/shared/ui/virtual-views/VirtualGridList/helpers';
  import VirtualGroupedList from '@/shared/ui/virtual-views/VirtualGroupedList/VirtualGroupedList.vue';
  import { getListProps } from '@/shared/ui/virtual-views/VirtualList/helpers';
  import { isAutoOpenAvailable } from '@/shared/utils/isAutoOpenAvailable';
  import { getGroupByFirstLetter } from '@/shared/utils/list';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  import FeatLink from './FeatLink.vue';

  type TProps = {
    storeKey?: string;
  };

  withDefaults(defineProps<TProps>(), {
    storeKey: '',
  });

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const { fullscreen } = storeToRefs(uiStore);

  const filter = useFilter({
    dbName: FeatsFilterDefaults.dbName,
    url: FeatsFilterDefaults.url,
  });

  const { initPages, items: feats } = usePagination<FeatsLinkItem>({
    url: '/feats',
    size: -1,
    filter: {
      isCustomized: filter.isCustomized,
      value: filter.queryParams,
    },
    search: filter.search,
    order: [
      {
        field: 'name',
        direction: 'asc',
      },
    ],
  });

  const onSearch = async () => {
    await initPages();

    if (isAutoOpenAvailable(feats)) {
      await router.push({ path: feats.value[0].url });
    }
  };

  onBeforeMount(async () => {
    await filter.initFilter();
    await initPages();
  });

  const showRightSide = computed(() => route.name === 'featDetail');

  const { setReference } = useScrollToPathInList({
    items: feats,
    showRightSide,
  });
</script>

<template>
  <content-layout
    :filter-instance="filter"
    :show-right-side="showRightSide"
    title="Черты"
    @search="onSearch"
    @update="initPages"
  >
    <virtual-grouped-list
      :list="getListProps({ items: feats })"
      :get-group="getGroupByFirstLetter"
      :grid="{
        flat: checkIsListGridFlat({ showRightSide, fullscreen }),
        reference: setReference,
      }"
    >
      <template #default="{ item: feat }">
        <feat-link
          :to="{ path: feat.url }"
          :feat="feat"
        />
      </template>
    </virtual-grouped-list>
  </content-layout>
</template>
