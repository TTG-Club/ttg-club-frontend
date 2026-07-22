<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import type { EquipmentItem } from '@/shared/types/inventory/Items';
  import type { Maybe } from '@/shared/types/Utility';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import PageLayout from '@/layouts/PageLayout.vue';

  import WorkshopRevisions from '../WorkshopRevisions.vue';

  import ItemEditor from './ItemEditor.vue';

  const route = useRoute();
  const item = ref<Maybe<EquipmentItem>>(undefined);
  const loading = ref(true);
  const editorKey = ref(0);

  const loadItem = async () => {
    try {
      const resp = await httpClient.post<EquipmentItem>({
        url: `/items/${route.params.itemName}`,
      });

      item.value = resp.data;
    } catch (err) {
      errorHandler(err);
    } finally {
      loading.value = false;
    }
  };

  const onRestored = async () => {
    await loadItem();
    editorKey.value += 1;
  };

  onBeforeMount(loadItem);
</script>

<template>
  <page-layout>
    <template #title>Редактирование снаряжения</template>

    <div v-if="loading">Загрузка...</div>

    <template v-else-if="item">
      <item-editor
        :key="editorKey"
        :item="item"
      />

      <workshop-revisions
        v-if="item.id"
        base-path="/workshop/items"
        :item-id="item.id"
        @restored="onRestored"
      />
    </template>

    <div v-else>Снаряжение не найдено.</div>
  </page-layout>
</template>
