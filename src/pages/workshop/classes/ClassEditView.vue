<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import type { TClassItem } from '@/shared/types/character/Classes';
  import type { Maybe } from '@/shared/types/Utility';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import PageLayout from '@/layouts/PageLayout.vue';

  import WorkshopRevisions from '../WorkshopRevisions.vue';

  import ClassEditor from './ClassEditor.vue';

  const route = useRoute();
  const classItem = ref<Maybe<TClassItem>>(undefined);
  const loading = ref(true);
  const editorKey = ref(0);

  const loadClass = async () => {
    try {
      const resp = await httpClient.post<TClassItem>({
        url: `/classes/${route.params.className}`,
        payload: {},
      });

      classItem.value = resp.data;
    } catch (err) {
      errorHandler(err);
    } finally {
      loading.value = false;
    }
  };

  const onRestored = async () => {
    await loadClass();
    editorKey.value += 1;
  };

  onBeforeMount(loadClass);
</script>

<template>
  <page-layout>
    <template #title>Редактирование класса</template>

    <div v-if="loading">Загрузка...</div>

    <template v-else-if="classItem">
      <class-editor
        :key="editorKey"
        :class-item="classItem"
      />

      <workshop-revisions
        v-if="classItem.id"
        base-path="/workshop/classes"
        :item-id="classItem.id"
        @restored="onRestored"
      />
    </template>

    <div v-else>Класс не найден.</div>
  </page-layout>
</template>
