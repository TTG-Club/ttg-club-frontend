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
        reference: setReference
      }"
      :get-group="getWeaponGroup"
      :list="
        getListProps({
          items: weapons,
          size: 'medium'
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

<script lang="ts" setup>
  import { storeToRefs } from 'pinia';
  import { computed, onBeforeMount } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import WeaponLink from '@/pages/inventory/weapons/WeaponLink.vue';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  import { useFilter } from '@/shared/composables/useFilter';
  import { usePagination } from '@/shared/composables/usePagination';
  import { useScrollToPathInList } from '@/shared/composables/useScrollToPathInList';
  import { isAutoOpenAvailable } from '@/shared/helpers/isAutoOpenAvailable';
  import { useUIStore } from '@/shared/stores/UIStore';
  import { WeaponsFilterDefaults } from '@/shared/types/inventory/Weapons.d';
  import type { AnyObject } from '@/shared/types/Utility';
  import { checkIsListGridFlat } from '@/shared/ui/virtual-views/VirtualGridList/helpers';
  import VirtualGroupedList from '@/shared/ui/virtual-views/VirtualGroupedList/VirtualGroupedList.vue';
  import { getListProps } from '@/shared/ui/virtual-views/VirtualList/helpers';

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const { fullscreen } = storeToRefs(uiStore);

  const filter = useFilter({
    dbName: WeaponsFilterDefaults.dbName,
    url: WeaponsFilterDefaults.url
  });

  const { initPages, items: weapons } = usePagination({
    url: '/weapons',
    size: -1,
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
    order: type.order
  });

  const { setReference } = useScrollToPathInList({
    items: weapons,
    showRightSide
  });
</script>
