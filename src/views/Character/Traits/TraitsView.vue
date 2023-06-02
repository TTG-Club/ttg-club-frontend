<template>
  <content-layout
    :filter-instance="filter"
    :show-right-side="showRightSide"
    :items="traits"
    title="Черты"
    virtualized
    @search="onSearch"
    @update="initPages"
  >
    <template #default="{ item: trait }">
      <trait-link
        v-if="trait"
        :to="{ path: trait.url }"
        :trait-item="trait"
      />
    </template>
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
  import { isAutoOpenAvailable } from '@/common/helpers/isAutoOpenAvailable';

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

    if (isAutoOpenAvailable(traits)) {
      await router.push({ path: traits.value[0].url });
    }
  };

  onBeforeMount(async () => {
    await filter.initFilter();
    await initPages();
  });

  const showRightSide = computed(() => route.name === 'traitDetail');
</script>
