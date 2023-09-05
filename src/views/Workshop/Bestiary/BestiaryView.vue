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
        reference: setReference
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

<script lang="ts" setup>
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

  import { BestiaryFilterDefaults } from '@/types/Workshop/Bestiary.d';

  import { useUIStore } from '@/store/UI/UIStore';
  import CreatureLink from '@/views/Workshop/Bestiary/CreatureLink.vue';

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();
  const { isMobile, fullscreen } = storeToRefs(uiStore);

  const filter = useFilter({
    url: BestiaryFilterDefaults.url,
    dbName: BestiaryFilterDefaults.dbName
  });

  const {
    initPages,
    nextPage,
    isEnd,
    items: bestiary
  } = usePagination({
    url: '/bestiary',
    filter: {
      isCustomized: filter.isCustomized,
      value: filter.queryParams
    },
    search: filter.search,
    order: [
      {
        field: 'exp',
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

    if (isAutoOpenAvailable(bestiary)) {
      await router.push({ path: bestiary.value[0].url });
    }
  };

  const getGroupByChallengeRating = (item: AnyObject) => ({
    name: item.challengeRating,
    url: item.challengeRating
  });

  onBeforeMount(async () => {
    await filter.initFilter();

    await initPages();
  });

  const showRightSide = computed(() => route.name === 'creatureDetail');

  const { setReference } = useScrollToPathInList({
    items: bestiary,
    showRightSide
  });
</script>
