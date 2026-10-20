<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import type { Maybe } from '@/shared/types/Utility';
  import type { RuleDetail } from '@/shared/types/wiki/Rules';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import PageLayout from '@/layouts/PageLayout.vue';

  import WorkshopRevisions from '../WorkshopRevisions.vue';

  import RuleEditor from './RuleEditor.vue';

  const route = useRoute();
  const rule = ref<Maybe<RuleDetail>>(undefined);
  const loading = ref(true);
  const editorKey = ref(0);

  const loadRule = async () => {
    try {
      const response = await httpClient.post<RuleDetail>({
        url: `/rules/${route.params.ruleName}`,
      });

      rule.value = response.data;
    } catch (err) {
      errorHandler(err);
    } finally {
      loading.value = false;
    }
  };

  const onRestored = async () => {
    await loadRule();
    editorKey.value += 1;
  };

  onBeforeMount(loadRule);
</script>

<template>
  <page-layout>
    <template #title>Редактирование правила или термина</template>

    <div v-if="loading">Загрузка...</div>

    <template v-else-if="rule">
      <rule-editor
        :key="editorKey"
        :rule="rule"
      />

      <workshop-revisions
        base-path="/workshop/rules"
        :item-id="rule.id"
        @restored="onRestored"
      />
    </template>

    <div v-else>Правило или термин не найден.</div>
  </page-layout>
</template>
