<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import type { FeatsItem } from '@/shared/types/character/Feats';
  import type { Maybe } from '@/shared/types/Utility';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import PageLayout from '@/layouts/PageLayout.vue';

  import FeatEditor from './FeatEditor.vue';

  const route = useRoute();
  const feat = ref<Maybe<FeatsItem>>(undefined);
  const loading = ref(true);

  onBeforeMount(async () => {
    try {
      const resp = await httpClient.post<FeatsItem>({
        url: `/feats/${route.params.featName}`,
      });

      feat.value = resp.data;
    } catch (err) {
      errorHandler(err);
    } finally {
      loading.value = false;
    }
  });
</script>

<template>
  <page-layout>
    <template #title>Редактирование черты</template>

    <div v-if="loading">Загрузка...</div>

    <feat-editor
      v-else-if="feat"
      :feat="feat"
    />

    <div v-else>Черта не найдена.</div>
  </page-layout>
</template>
