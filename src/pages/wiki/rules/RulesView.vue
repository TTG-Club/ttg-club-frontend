<script lang="ts" setup>
  import { useFilter } from '@/shared/composable/useFilter';
  import { usePagination } from '@/shared/composable/usePagination';
  import { useScrollToPathInList } from '@/shared/composable/useScrollToPathInList';
  import { useUIStore } from '@/shared/stores/UIStore';
  import { RulesFilterDefaults } from '@/shared/types/wiki/Rules.d';
  import { checkIsListGridFlat } from '@/shared/ui/virtual-views/VirtualGridList/helpers';
  import VirtualGridList from '@/shared/ui/virtual-views/VirtualGridList/VirtualGridList.vue';
  import { getListProps } from '@/shared/ui/virtual-views/VirtualList/helpers';
  import { isAutoOpenAvailable } from '@/shared/utils/isAutoOpenAvailable';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  import RuleLink from '@/pages/wiki/rules/RuleLink.vue';

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const { fullscreen } = storeToRefs(uiStore);

  const filter = useFilter({
    dbName: RulesFilterDefaults.dbName,
    url: RulesFilterDefaults.url,
  });

  const {
    initPages,
    nextPage,
    isEnd,
    items: rules,
  } = usePagination({
    url: '/rules',
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
    showRightSide,
  });
</script>

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
