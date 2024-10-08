<script lang="ts" setup>
  import { useFilter } from '@/shared/composable/useFilter';
  import { usePagination } from '@/shared/composable/usePagination';
  import { useScrollToPathInList } from '@/shared/composable/useScrollToPathInList';
  import { useUIStore } from '@/shared/stores/UIStore';
  import { WeaponsFilterDefaults } from '@/shared/types/inventory/Weapons.d';
  import type { AnyObject } from '@/shared/types/Utility';
  import { checkIsListGridFlat } from '@/shared/ui/virtual-views/VirtualGridList/helpers';
  import VirtualGroupedList from '@/shared/ui/virtual-views/VirtualGroupedList/VirtualGroupedList.vue';
  import { getListProps } from '@/shared/ui/virtual-views/VirtualList/helpers';
  import { isAutoOpenAvailable } from '@/shared/utils/isAutoOpenAvailable';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  import WeaponLink from '@/pages/inventory/weapons/WeaponLink.vue';

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const { fullscreen } = storeToRefs(uiStore);

  const filter = useFilter({
    dbName: WeaponsFilterDefaults.dbName,
    url: WeaponsFilterDefaults.url,
  });

  const { initPages, items: weapons } = usePagination({
    url: '/weapons',
    size: -1,
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

    if (isAutoOpenAvailable(weapons)) {
      await router.push({ path: weapons.value[0].url });
    }
  };

  onBeforeMount(async () => {
    await filter.initFilter();
    await initPages();
  });

  const showRightSide = computed(() => route.name === 'weaponDetail');

  /* TODO: Добавить тип доспеха */
  const getWeaponGroup = ({ type }: AnyObject & { type: AnyObject }) => ({
    url: type.name,
    name: type.name,
    order: type.order,
  });

  const { setReference } = useScrollToPathInList({
    items: weapons,
    showRightSide,
  });
</script>

<template>
  <content-layout
    :filter-instance="filter"
    :show-right-side="showRightSide"
    title="Оружие"
    @search="onSearch"
    @update="initPages"
  >
    <virtual-grouped-list
      :grid="{
        flat: checkIsListGridFlat({ showRightSide, fullscreen }),
        reference: setReference,
      }"
      :get-group="getWeaponGroup"
      :list="
        getListProps({
          items: weapons,
          size: 'medium',
        })
      "
    >
      <template #default="{ item: weapon }">
        <weapon-link
          :to="{ path: weapon.url }"
          :weapon="weapon"
        />
      </template>
    </virtual-grouped-list>
  </content-layout>
</template>
