<template>
  <content-layout
    :filter-instance="filter"
    :show-right-side="showRightSide"
    title="Оружие"
    @search="onSearch"
    @update="initPages"
  >
    <virtual-grouped-list
      :grid="{ flat: showRightSide }"
      :get-group="getWeaponGroup"
      :list="{
        keyField: DEFAULT_ENTITY_KEY_FIELD,
        items: weapons,
      }"
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
  import { computed, onBeforeMount } from 'vue';
  import { storeToRefs } from 'pinia';
  import { useRoute, useRouter } from 'vue-router';
  import ContentLayout from '@/components/content/ContentLayout.vue';
  import { useUIStore } from '@/store/UI/UIStore';
  import { useFilter } from '@/common/composition/useFilter';
  import { WeaponsFilterDefaults } from '@/types/Inventory/Weapons.types';
  import { usePagination } from '@/common/composition/usePagination';
  import VirtualGroupedList from "@/components/list/VirtualGroupedList/VirtualGroupedList.vue";
  import type { AnyObject } from "@/types/Shared/Utility.types";
  import WeaponLink from "@/views/Inventory/Weapons/WeaponLink.vue";
  import { DEFAULT_ENTITY_KEY_FIELD } from "@/common/const";

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const {
    isMobile,
    fullscreen
  } = storeToRefs(uiStore);

  const filter = useFilter({
    dbName: WeaponsFilterDefaults.dbName,
    url: WeaponsFilterDefaults.url
  });

  const {
    initPages,
    items: weapons
  } = usePagination({
    url: '/weapons',
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

    if (weapons.value.length === 1 && !isMobile.value) {
      await router.push({ path: weapons.value[0].url });
    }
  };

  onBeforeMount(async () => {
    await filter.initFilter();
    await initPages();
  });

  const showRightSide = computed(() => route.name === 'weaponDetail');

  /* TODO: Добавить тип доспеха */
  const getWeaponGroup = ({ type }: AnyObject & {type: AnyObject}) => ({
    url: type.name,
    name: type.name,
    order: type.order
  });
</script>
