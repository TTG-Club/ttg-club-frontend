<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import type { ArmorItem } from '@/shared/types/inventory/Armors';
  import type { Maybe } from '@/shared/types/Utility';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import PageLayout from '@/layouts/PageLayout.vue';

  import ArmorEditor from './ArmorEditor.vue';

  const route = useRoute();
  const armor = ref<Maybe<ArmorItem>>(undefined);
  const loading = ref(true);

  onBeforeMount(async () => {
    try {
      const resp = await httpClient.post<ArmorItem>({
        url: `/armors/${route.params.armorName}`,
      });

      armor.value = resp.data;
    } catch (err) {
      errorHandler(err);
    } finally {
      loading.value = false;
    }
  });
</script>

<template>
  <page-layout>
    <template #title>Редактирование доспеха</template>

    <div v-if="loading">Загрузка...</div>

    <armor-editor
      v-else-if="armor"
      :armor="armor"
    />

    <div v-else>Доспех не найден.</div>
  </page-layout>
</template>
