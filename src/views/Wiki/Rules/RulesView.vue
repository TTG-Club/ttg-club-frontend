<template>
  <content-layout
    :filter-instance="filter"
    :is-end="isEnd"
    :on-load-more="nextPage"
    :show-right-side="showRightSide"
    title="Правила и термины"
    @search="onSearch"
    @update="initPages"
  >
    <virtual-grid-list
      :flat="checkIsListGridFlat({ showRightSide, fullscreen })"
      :reference="setReference"
      :list="getListProps({ items: rules, size: 'small' })"
    >
      <template #default="{ item: rule }">
        <rule-link
          :rule="rule"
          :to="{ path: rule.url }"
        />
      </template>
    </virtual-grid-list>
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

  import ContentLayout from '@/components/content/ContentLayout.vue';
  import { checkIsListGridFlat } from '@/components/list/VirtualGridList/helpers';
  import VirtualGridList from '@/components/list/VirtualGridList/VirtualGridList.vue';
  import { getListProps } from '@/components/list/VirtualList/helpers';

  import { RulesFilterDefaults } from '@/types/Wiki/Rules.d';

  import { useUIStore } from '@/store/UI/UIStore';
  import RuleLink from '@/views/Wiki/Rules/RuleLink.vue';

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const { isMobile, fullscreen } = storeToRefs(uiStore);

  const filter = useFilter({
    dbName: RulesFilterDefaults.dbName,
    url: RulesFilterDefaults.url
  });

  const {
    initPages,
    nextPage,
    isEnd,
    items: rules
  } = usePagination({
    url: '/rules',
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

    if (isAutoOpenAvailable(rules)) {
      await router.push({ path: rules.value[0].url });
    }
  };

  onBeforeMount(async () => {
    await filter.initFilter();
    await initPages();
  });

  const showRightSide = computed(() => route.name === 'ruleDetail');

  const { setReference } = useScrollToPathInList({
    items: rules,
    showRightSide
  });
</script>
