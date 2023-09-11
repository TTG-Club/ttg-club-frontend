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
        reference: setReference
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

<script lang="ts" setup>
  import { storeToRefs } from 'pinia';
  import { computed, onBeforeMount } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import ArmorLink from '@/pages/Inventory/Armors/ArmorLink.vue';

  import { useFilter } from '@/shared/compositions/useFilter';
  import { usePagination } from '@/shared/compositions/usePagination';
  import { useScrollToPathInList } from '@/shared/compositions/useScrollToPathInList';
  import { isAutoOpenAvailable } from '@/shared/helpers/isAutoOpenAvailable';
  import { useUIStore } from '@/shared/stores/UIStore';
  import { ArmorsFilterDefaults } from '@/shared/types/Inventory/Armors.d';
  import type { AnyObject } from '@/shared/types/Utility';
  import ContentLayout from '@/shared/ui/content/ContentLayout.vue';
  import { checkIsListGridFlat } from '@/shared/ui/virtual-views/VirtualGridList/helpers';
  import VirtualGroupedList from '@/shared/ui/virtual-views/VirtualGroupedList/VirtualGroupedList.vue';
  import { getListProps } from '@/shared/ui/virtual-views/VirtualList/helpers';

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const { fullscreen } = storeToRefs(uiStore);

  const filter = useFilter({
    dbName: ArmorsFilterDefaults.dbName,
    url: ArmorsFilterDefaults.url
  });

  const { initPages, items: armors } = usePagination({
    url: '/armors',
    limit: -1,
    search: filter.search,
    order: [
      {
        field: 'AC',
        direction: 'asc'
      }
    ]
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
    order: type.order
  });

  onBeforeMount(async () => {
    await initPages();
  });

  const showRightSide = computed(() => route.name === 'armorDetail');

  const { setReference } = useScrollToPathInList({
    items: armors,
    showRightSide
  });
</script>
