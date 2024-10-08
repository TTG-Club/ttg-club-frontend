<script lang="ts" setup>
  import { useFilter } from '@/shared/composable/useFilter';
  import { usePagination } from '@/shared/composable/usePagination';
  import { useScrollToPathInList } from '@/shared/composable/useScrollToPathInList';
  import { useUIStore } from '@/shared/stores/UIStore';
  import type { AnyObject } from '@/shared/types/Utility';
  import { BestiaryFilterDefaults } from '@/shared/types/workshop/Bestiary.d';
  import { checkIsListGridFlat } from '@/shared/ui/virtual-views/VirtualGridList/helpers';
  import VirtualGroupedList from '@/shared/ui/virtual-views/VirtualGroupedList/VirtualGroupedList.vue';
  import { getListProps } from '@/shared/ui/virtual-views/VirtualList/helpers';
  import { isAutoOpenAvailable } from '@/shared/utils/isAutoOpenAvailable';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  import CreatureLink from '@/pages/workshop/bestiary/CreatureLink.vue';

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();
  const { fullscreen } = storeToRefs(uiStore);

  const filter = useFilter({
    url: BestiaryFilterDefaults.url,
    dbName: BestiaryFilterDefaults.dbName,
  });

  const {
    initPages,
    nextPage,
    isEnd,
    items: bestiary,
  } = usePagination({
    url: '/bestiary',
    filter: {
      isCustomized: filter.isCustomized,
      value: filter.queryParams,
    },
    search: filter.search,
    order: [
      {
        field: 'exp',
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

    if (isAutoOpenAvailable(bestiary)) {
      await router.push({ path: bestiary.value[0].url });
    }
  };

  const getGroupByChallengeRating = (item: AnyObject) => ({
    name: item.challengeRating,
    url: item.challengeRating,
  });

  onBeforeMount(async () => {
    await filter.initFilter();

    await initPages();
  });

  const showRightSide = computed(() => route.name === 'creatureDetail');

  const { setReference } = useScrollToPathInList({
    items: bestiary,
    showRightSide,
  });
</script>

<template>
  <content-layout
    :filter-instance="filter"
    :show-right-side="showRightSide"
    :is-end="isEnd"
    :on-load-more="nextPage"
    title="Бестиарий"
    @search="onSearch"
    @update="initPages"
  >
    <virtual-grouped-list
      :list="getListProps({ items: bestiary, size: 'medium' })"
      :get-group="getGroupByChallengeRating"
      :grid="{
        flat: checkIsListGridFlat({ showRightSide, fullscreen }),
        reference: setReference,
      }"
    >
      <template #default="{ item: creature }">
        <creature-link
          :creature="creature"
          :to="{ path: creature.url }"
        />
      </template>
    </virtual-grouped-list>
  </content-layout>
</template>
