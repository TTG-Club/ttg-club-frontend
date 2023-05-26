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
      :grid="{ flat: checkIsListGridFlat({ showRightSide, fullscreen }) }"
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
  import { computed, onBeforeMount } from 'vue';
  import { storeToRefs } from 'pinia';
  import { useRoute, useRouter } from 'vue-router';
  import ContentLayout from '@/components/content/ContentLayout.vue';
  import TraitLink from '@/views/Character/Traits/TraitLink.vue';
  import { useUIStore } from '@/store/UI/UIStore';
  import { useFilter } from '@/common/composition/useFilter';
  import { usePagination } from '@/common/composition/usePagination';
  import { TraitsFilterDefaults } from '@/types/Character/Traits.types';
  import VirtualGroupedList from '@/components/list/VirtualGroupedList/VirtualGroupedList.vue';
  import { getGroupByFirstLetter } from "@/common/helpers/list";
  import { getListProps } from "@/components/list/VirtualList/helpers";
  import { checkIsListGridFlat } from "@/components/list/VirtualGridList/helpers";

  type TProps = {
    storeKey?: string;
  }

  const props = (withDefaults(defineProps<TProps>(), {
    storeKey: ''
  }));

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const {
    isMobile,
    fullscreen
  } = storeToRefs(uiStore);

  const filter = useFilter({
    dbName: TraitsFilterDefaults.dbName,
    url: TraitsFilterDefaults.url
  });

  const {
    initPages,
    items: traits
  } = usePagination({
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

    if (traits.value.length === 1 && !isMobile.value) {
      await router.push({ path: traits.value[0].url });
    }
  };

  onBeforeMount(async () => {
    await filter.initFilter();
    await initPages();
  });

  const showRightSide = computed(() => route.name === 'traitDetail');
</script>
