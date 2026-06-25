<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import type { TClassItem } from '@/shared/types/character/Classes';
  import type { Maybe } from '@/shared/types/Utility';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import PageLayout from '@/layouts/PageLayout.vue';

  import ClassEditor from './ClassEditor.vue';

  const route = useRoute();
  const classItem = ref<Maybe<TClassItem>>(undefined);
  const loading = ref(true);

  onBeforeMount(async () => {
    try {
      const resp = await httpClient.post<TClassItem>({
        url: `/classes/${route.params.className}`,
      });

      classItem.value = resp.data;
    } catch (err) {
      errorHandler(err);
    } finally {
      loading.value = false;
    }
  });
</script>

<template>
  <page-layout>
    <template #title>Редактирование класса</template>

    <div v-if="loading">Загрузка...</div>

    <class-editor
      v-else-if="classItem"
      :class-item="classItem"
    />

    <div v-else>Класс не найден.</div>
  </page-layout>
</template>
