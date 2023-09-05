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

  import { useFilter } from '@/shared/composition/useFilter';
  import { usePagination } from '@/shared/composition/usePagination';
  import { useScrollToPathInList } from '@/shared/composition/useScrollToPathInList';
  import { isAutoOpenAvailable } from '@/shared/helpers/isAutoOpenAvailable';
  import { getGroupByFirstLetter } from '@/shared/helpers/list';

  import ContentLayout from '@/components/content/ContentLayout.vue';
  import { checkIsListGridFlat } from '@/components/list/VirtualGridList/helpers';
  import VirtualGroupedList from '@/components/list/VirtualGroupedList/VirtualGroupedList.vue';
  import { getListProps } from '@/components/list/VirtualList/helpers';

  import { TraitsFilterDefaults } from '@/types/Character/Traits.d';

  import { useUIStore } from '@/store/UI/UIStore';
  import TraitLink from '@/views/Character/Traits/TraitLink.vue';

  type TProps = {
    storeKey?: string;
  };

  const props = withDefaults(defineProps<TProps>(), {
    storeKey: ''
  });

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const { isMobile, fullscreen } = storeToRefs(uiStore);

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
