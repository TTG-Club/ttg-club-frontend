<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import type { TArtifactItem } from '@/shared/types/inventory/MagicItems';
  import type { Maybe } from '@/shared/types/Utility';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import PageLayout from '@/layouts/PageLayout.vue';

  import WorkshopRevisions from '../WorkshopRevisions.vue';

  import MagicItemEditor from './MagicItemEditor.vue';

  const route = useRoute();
  const magicItem = ref<Maybe<TArtifactItem>>(undefined);
  const loading = ref(true);
  const editorKey = ref(0);

  const loadItem = async () => {
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
  };

  const onRestored = async () => {
    await loadItem();
    // пересобираем форму редактора из восстановленного состояния
    editorKey.value += 1;
  };

  onBeforeMount(loadItem);
</script>

<template>
  <page-layout>
    <template #title>Редактирование магического предмета</template>

    <div v-if="loading">Загрузка...</div>

    <template v-else-if="magicItem">
      <magic-item-editor
        :key="editorKey"
        :magic-item="magicItem"
      />

      <workshop-revisions
        v-if="magicItem.id"
        base-path="/workshop/items/magic"
        :item-id="magicItem.id"
        @restored="onRestored"
      />
    </template>

    <div v-else>Магический предмет не найден.</div>
  </page-layout>
</template>
