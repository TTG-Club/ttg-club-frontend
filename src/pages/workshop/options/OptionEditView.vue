<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import type { OptionDetail } from '@/shared/types/character/Options';
  import type { Maybe } from '@/shared/types/Utility';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import PageLayout from '@/layouts/PageLayout.vue';

  import WorkshopRevisions from '../WorkshopRevisions.vue';

  import OptionEditor from './OptionEditor.vue';

  const route = useRoute();
  const option = ref<Maybe<OptionDetail>>(undefined);
  const loading = ref(true);
  const editorKey = ref(0);

  const loadOption = async () => {
    try {
      const resp = await httpClient.post<OptionDetail>({
        url: `/options/${route.params.optionName}`,
      });

      option.value = resp.data;
    } catch (err) {
      errorHandler(err);
    } finally {
      loading.value = false;
    }
  };

  const onRestored = async () => {
    await loadOption();
    editorKey.value += 1;
  };

  onBeforeMount(loadOption);
</script>

<template>
  <page-layout>
    <template #title>Редактирование особенности класса</template>

    <div v-if="loading">Загрузка...</div>

    <template v-else-if="option">
      <option-editor
        :key="editorKey"
        :option="option"
      />

      <workshop-revisions
        v-if="option.id"
        base-path="/workshop/options"
        :item-id="option.id"
        @restored="onRestored"
      />
    </template>

    <div v-else>Особенность не найдена.</div>
  </page-layout>
</template>
