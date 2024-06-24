<script lang="ts" setup>
  import { useFilter } from '@/shared/composable/useFilter';
  import { usePagination } from '@/shared/composable/usePagination';
  import { useScrollToPathInList } from '@/shared/composable/useScrollToPathInList';
  import { useUIStore } from '@/shared/stores/UIStore';
  import { ArmorsFilterDefaults } from '@/shared/types/inventory/Armors.d';
  import type { AnyObject } from '@/shared/types/Utility';
  import { checkIsListGridFlat } from '@/shared/ui/virtual-views/VirtualGridList/helpers';
  import VirtualGroupedList from '@/shared/ui/virtual-views/VirtualGroupedList/VirtualGroupedList.vue';
  import { getListProps } from '@/shared/ui/virtual-views/VirtualList/helpers';
  import { isAutoOpenAvailable } from '@/shared/utils/isAutoOpenAvailable';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  import ArmorLink from '@/pages/inventory/armors/ArmorLink.vue';

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const { fullscreen } = storeToRefs(uiStore);

  const filter = useFilter({
    dbName: ArmorsFilterDefaults.dbName,
    url: ArmorsFilterDefaults.url,
  });

  const { initPages, items: armors } = usePagination({
    url: '/armors',
    size: -1,
    filter: {
      isCustomized: filter.isCustomized,
      value: filter.queryParams,
    },
    search: filter.search,
    order: [
      {
        field: 'AC',
        direction: 'asc',
      },
    ],
  });

  const onSearch = async () => {
    await initPages();

    if (isAutoOpenAvailable(armors)) {
      await router.push({ path: armors.value[0].url });
    }
  };

  const getArmorGroup = ({ type }: AnyObject & { type: AnyObject }) => ({
    url: type.name,
    name: type.name,
    order: type.order,
  });

  onBeforeMount(async () => {
    await filter.initFilter();
    await initPages();
  });

  const showRightSide = computed(() => route.name === 'armorDetail');

  const { setReference } = useScrollToPathInList({
    items: armors,
    showRightSide,
  });
</script>

<template>
  <content-layout
    :filter-instance="filter"
    :show-right-side="showRightSide"
    title="Доспехи"
    @search="onSearch"
    @update="initPages"
  >
    <virtual-grouped-list
      :grid="{
        flat: checkIsListGridFlat({ showRightSide, fullscreen }),
        reference: setReference,
      }"
      :get-group="getArmorGroup"
      :list="getListProps({ items: armors, size: 'medium' })"
    >
      <template #default="{ item: armor }">
        <armor-link
          :armor="armor"
          :to="{ path: armor.url }"
        />
      </template>
    </virtual-grouped-list>
  </content-layout>
</template>
