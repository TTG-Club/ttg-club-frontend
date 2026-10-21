<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import type { Maybe } from '@/shared/types/Utility';
  import type { IScreenDetail } from '@/shared/types/workshop/Screens';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import PageLayout from '@/layouts/PageLayout.vue';

  import WorkshopRevisions from '../WorkshopRevisions.vue';

  import ScreenEditor from './ScreenEditor.vue';

  const route = useRoute();
  const screen = ref<Maybe<IScreenDetail>>(undefined);
  const loading = ref(true);
  const editorKey = ref(0);

  const loadScreen = async () => {
    try {
      loading.value = true;

      const response = await httpClient.post<IScreenDetail>({
        url: `/screens/${route.params.screenName}`,
      });

      screen.value = response.data;
    } catch (err) {
      errorHandler(err);
      screen.value = undefined;
    } finally {
      loading.value = false;
    }
  };

  const onRestored = async () => {
    await loadScreen();
    editorKey.value += 1;
  };

  onBeforeMount(loadScreen);
</script>

<template>
  <page-layout>
    <template #title>Редактирование раздела ширмы</template>

    <div v-if="loading">Загрузка...</div>

    <template v-else-if="screen">
      <screen-editor
        :key="editorKey"
        :screen="screen"
      />

      <workshop-revisions
        base-path="/workshop/screens"
        :item-id="screen.id"
        @restored="onRestored"
      />
    </template>

    <div v-else>Раздел ширмы не найден.</div>
  </page-layout>
</template>
