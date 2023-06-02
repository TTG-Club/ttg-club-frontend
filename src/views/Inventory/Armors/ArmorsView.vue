<template>
  <content-layout
    :filter-instance="filter"
    :show-right-side="showRightSide"
    :items="armors"
    :get-group="getArmorGroup"
    virtualized
    title="Доспехи"
    @search="onSearch"
    @update="initPages"
  >
    <template #default="{ item: armor }">
      <armor-link
        v-if="armor"
        :armor="armor"
        :to="{ path: armor.url }"
      />
    </template>
  </content-layout>
</template>

<script lang="ts" setup>
  import { computed, onBeforeMount } from 'vue';
  import { storeToRefs } from 'pinia';
  import { useRoute, useRouter } from 'vue-router';
  import ContentLayout from '@/components/content/ContentLayout.vue';
  import ArmorLink from '@/views/Inventory/Armors/ArmorLink.vue';
  import { useUIStore } from '@/store/UI/UIStore';
  import { useFilter } from '@/common/composition/useFilter';
  import { usePagination } from '@/common/composition/usePagination';
  import { ArmorsFilterDefaults } from '@/types/Inventory/Armors.types';
  import type { AnyObject } from '@/types/Shared/Utility.types';
  import { isAutoOpenAvailable } from '@/common/helpers/isAutoOpenAvailable';

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const {
    isMobile,
    fullscreen
  } = storeToRefs(uiStore);

  const filter = useFilter({
    dbName: ArmorsFilterDefaults.dbName,
    url: ArmorsFilterDefaults.url
  });

  const {
    initPages,
    items: armors
  } = usePagination({
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

  const getArmorGroup = ({ type }: AnyObject & {type: AnyObject}) => ({
    url: type.name,
    name: type.name,
    order: type.order
  });

  onBeforeMount(async () => {
    await initPages();
  });

  const showRightSide = computed(() => route.name === 'armorDetail');
</script>
