<template>
  <content-layout
    :filter-instance="filter"
    :show-right-side="showRightSide"
    title="Черты"
    @search="onSearch"
    @update="initPages"
  >
    <virtual-grouped-list
      :list="getListProps({ items: traits })"
      :get-group="getGroupByFirstLetter"
      :grid="{
        flat: checkIsListGridFlat({ showRightSide, fullscreen }),
        reference: setReference
      }"
    >
      <template #default="{ item: trait }">
        <trait-link
          :to="{ path: trait.url }"
          :trait-item="trait"
        />
      </template>
    </virtual-grouped-list>
  </content-layout>
</template>

<script lang="ts" setup>
  import { storeToRefs } from 'pinia';
  import { computed, onBeforeMount } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import TraitLink from '@/pages/Character/Traits/TraitLink.vue';

  import { useFilter } from '@/shared/compositions/useFilter';
  import { usePagination } from '@/shared/compositions/usePagination';
  import { useScrollToPathInList } from '@/shared/compositions/useScrollToPathInList';
  import { isAutoOpenAvailable } from '@/shared/helpers/isAutoOpenAvailable';
  import { getGroupByFirstLetter } from '@/shared/helpers/list';
  import { useUIStore } from '@/shared/stores/UIStore';
  import { TraitsFilterDefaults } from '@/shared/types/Character/Traits.d';
  import ContentLayout from '@/shared/ui/content/ContentLayout.vue';
  import { checkIsListGridFlat } from '@/shared/ui/virtual-views/VirtualGridList/helpers';
  import VirtualGroupedList from '@/shared/ui/virtual-views/VirtualGroupedList/VirtualGroupedList.vue';
  import { getListProps } from '@/shared/ui/virtual-views/VirtualList/helpers';

  type TProps = {
    storeKey?: string;
  };

  withDefaults(defineProps<TProps>(), {
    storeKey: ''
  });

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const { fullscreen } = storeToRefs(uiStore);

  const filter = useFilter({
    dbName: TraitsFilterDefaults.dbName,
    url: TraitsFilterDefaults.url
  });

  const { initPages, items: traits } = usePagination({
    url: '/traits',
    limit: -1,
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

    if (isAutoOpenAvailable(traits)) {
      await router.push({ path: traits.value[0].url });
    }
  };

  onBeforeMount(async () => {
    await filter.initFilter();
    await initPages();
  });

  const showRightSide = computed(() => route.name === 'traitDetail');

  const { setReference } = useScrollToPathInList({
    items: traits,
    showRightSide
  });
</script>
