<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import type { Maybe } from '@/shared/types/Utility';
  import type { GodEdit } from '@/shared/types/wiki/Gods';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import PageLayout from '@/layouts/PageLayout.vue';

  import WorkshopRevisions from '../WorkshopRevisions.vue';

  import GodEditor from './GodEditor.vue';

  const route = useRoute();
  const god = ref<Maybe<GodEdit>>(undefined);
  const loading = ref(true);
  const editorKey = ref(0);

  const loadGod = async () => {
    try {
      loading.value = true;

      const response = await httpClient.get<GodEdit>({
        url: `/workshop/gods/${route.params.godName}`,
      });

      god.value = response.data;
    } catch (err) {
      errorHandler(err);
      god.value = undefined;
    } finally {
      loading.value = false;
    }
  };

  const onRestored = async () => {
    await loadGod();
    editorKey.value += 1;
  };

  onBeforeMount(loadGod);
</script>

<template>
  <page-layout>
    <template #title>Редактирование божества</template>

    <div v-if="loading">Загрузка...</div>

    <template v-else-if="god">
      <god-editor
        :key="editorKey"
        :god="god"
      />

      <workshop-revisions
        base-path="/workshop/gods"
        :item-id="god.id"
        @restored="onRestored"
      />
    </template>

    <div v-else>Божество не найдено.</div>
  </page-layout>
</template>
