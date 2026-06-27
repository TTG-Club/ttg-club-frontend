<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import type { BackgroundItem } from '@/shared/types/character/Backgrounds';
  import type { Maybe } from '@/shared/types/Utility';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import PageLayout from '@/layouts/PageLayout.vue';

  import BackgroundEditor from './BackgroundEditor.vue';

  const route = useRoute();
  const background = ref<Maybe<BackgroundItem>>(undefined);
  const loading = ref(true);

  onBeforeMount(async () => {
    try {
      const resp = await httpClient.post<BackgroundItem>({
        url: `/backgrounds/${route.params.backgroundName}`,
      });

      background.value = resp.data;
    } catch (err) {
      errorHandler(err);
    } finally {
      loading.value = false;
    }
  });
</script>

<template>
  <page-layout>
    <template #title>Редактирование предыстории</template>

    <div v-if="loading">Загрузка...</div>

    <background-editor
      v-else-if="background"
      :background="background"
    />

    <div v-else>Предыстория не найдена.</div>
  </page-layout>
</template>
