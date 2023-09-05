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

  import { useFilter } from '@/shared/composition/useFilter';
  import { usePagination } from '@/shared/composition/usePagination';
  import { useScrollToPathInList } from '@/shared/composition/useScrollToPathInList';
  import { isAutoOpenAvailable } from '@/shared/helpers/isAutoOpenAvailable';
  import type { AnyObject } from '@/shared/types/Utility';

  import ContentLayout from '@/components/content/ContentLayout.vue';
  import { checkIsListGridFlat } from '@/components/list/VirtualGridList/helpers';
  import VirtualGroupedList from '@/components/list/VirtualGroupedList/VirtualGroupedList.vue';
  import { getListProps } from '@/components/list/VirtualList/helpers';

  import { ArmorsFilterDefaults } from '@/types/Inventory/Armors.d';

  import { useUIStore } from '@/store/UI/UIStore';
  import ArmorLink from '@/views/Inventory/Armors/ArmorLink.vue';

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const { isMobile, fullscreen } = storeToRefs(uiStore);

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
