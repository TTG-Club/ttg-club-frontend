<template>
  <content-layout
    :filter-instance="filter"
    :show-right-side="showRightSide"
    title="Бестиарий"
    @search="onSearch"
    @update="initPages"
    @list-end="nextPage"
  >
    <virtual-grid-list
      :list="{ items: bestiary, keyField: DEFAULT_ENTITY_KEY_FIELD }"
      :flat="showRightSide"
    >
      <template #default="{ item: creature }">
        <creature-link
          :creature="creature"
          :to="{ path: creature.url }"
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
  import CreatureLink from '@/views/Workshop/Bestiary/CreatureLink.vue';
  import { useUIStore } from '@/store/UI/UIStore';
  import { useFilter } from '@/common/composition/useFilter';
  import { usePagination } from '@/common/composition/usePagination';
  import { BestiaryFilterDefaults } from '@/types/Workshop/Bestiary.types';
  import VirtualGridList from '@/components/list/VirtualGridList/VirtualGridList.vue';
  import { DEFAULT_ENTITY_KEY_FIELD } from "@/common/const";

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();
  const { isMobile } = storeToRefs(uiStore);

  const filter = useFilter({
    url: BestiaryFilterDefaults.url,
    dbName: BestiaryFilterDefaults.dbName
  });

  const {
    initPages,
    nextPage,
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

    if (!isMobile.value && bestiary.value.length) {
      await router.push({ path: bestiary.value[0].url });
    }
  };

  onBeforeMount(async () => {
    await filter.initFilter();

    await initPages();
  });

  const showRightSide = computed(() => route.name === 'creatureDetail');
</script>
