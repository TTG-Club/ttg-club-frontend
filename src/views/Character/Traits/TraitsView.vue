<template>
  <content-layout
    :filter-instance="filter"
    :show-right-side="showRightSide"
    title="Черты"
    @search="onSearch"
    @update="initPages"
  >
    <virtual-grid-list
      :flat="showRightSide"
      :list="{ items: traits, keyField: 'url' }"
    >
      <template #default="{ item: trait }">
        <trait-link
          :to="{ path: trait.url }"
          :trait-item="trait"
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
  import TraitLink from '@/views/Character/Traits/TraitLink.vue';
  import { useUIStore } from '@/store/UI/UIStore';
  import { useFilter } from '@/common/composition/useFilter';
  import { usePagination } from '@/common/composition/usePagination';
  import { TraitsFilterDefaults } from '@/types/Character/Traits.types';
  import VirtualGridList from '@/components/list/VirtualGridList/VirtualGridList.vue';

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

    if (!isMobile.value && traits.value.length && route.name === 'traits') {
      await router.push({ path: traits.value[0].url });
    }
  });

  const showRightSide = computed(() => route.name === 'traitDetail');
</script>
