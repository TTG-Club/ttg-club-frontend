<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import type { FeatsItem } from '@/shared/types/character/Feats';
  import type { Maybe } from '@/shared/types/Utility';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import PageLayout from '@/layouts/PageLayout.vue';

  import WorkshopRevisions from '../WorkshopRevisions.vue';

  import FeatEditor from './FeatEditor.vue';

  const route = useRoute();
  const feat = ref<Maybe<FeatsItem>>(undefined);
  const loading = ref(true);
  const editorKey = ref(0);

  const loadFeat = async () => {
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
  };

  const onRestored = async () => {
    await loadFeat();
    editorKey.value += 1;
  };

  onBeforeMount(loadFeat);
</script>

<template>
  <page-layout>
    <template #title>Редактирование черты</template>

    <div v-if="loading">Загрузка...</div>

    <template v-else-if="feat">
      <feat-editor
        :key="editorKey"
        :feat="feat"
      />

      <workshop-revisions
        v-if="feat.id"
        base-path="/workshop/feats"
        :item-id="feat.id"
        @restored="onRestored"
      />
    </template>

    <div v-else>Черта не найдена.</div>
  </page-layout>
</template>
