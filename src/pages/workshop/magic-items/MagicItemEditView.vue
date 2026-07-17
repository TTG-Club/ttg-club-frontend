<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import type { TArtifactItem } from '@/shared/types/inventory/MagicItems';
  import type { Maybe } from '@/shared/types/Utility';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import PageLayout from '@/layouts/PageLayout.vue';

  import MagicItemEditor from './MagicItemEditor.vue';

  const route = useRoute();
  const magicItem = ref<Maybe<TArtifactItem>>(undefined);
  const loading = ref(true);

  onBeforeMount(async () => {
    try {
      const resp = await httpClient.post<TArtifactItem>({
        url: `/items/magic/${route.params.magicItemName}`,
      });

      magicItem.value = resp.data;
    } catch (err) {
      errorHandler(err);
    } finally {
      loading.value = false;
    }
  });
</script>

<template>
  <page-layout>
    <template #title>Редактирование магического предмета</template>

    <div v-if="loading">Загрузка...</div>

    <magic-item-editor
      v-else-if="magicItem"
      :magic-item="magicItem"
    />

    <div v-else>Магический предмет не найден.</div>
  </page-layout>
</template>
