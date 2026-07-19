<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import type { ArmorItem } from '@/shared/types/inventory/Armors';
  import type { Maybe } from '@/shared/types/Utility';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import PageLayout from '@/layouts/PageLayout.vue';

  import WorkshopRevisions from '../WorkshopRevisions.vue';

  import ArmorEditor from './ArmorEditor.vue';

  const route = useRoute();
  const armor = ref<Maybe<ArmorItem>>(undefined);
  const loading = ref(true);
  const editorKey = ref(0);

  const loadArmor = async () => {
    try {
      const resp = await httpClient.post<ArmorItem>({
        url: `/armors/${route.params.armorName}`,
      });

      armor.value = resp.data;
    } catch (err) {
      errorHandler(err);
    } finally {
      loading.value = false;
    }
  };

  const onRestored = async () => {
    await loadArmor();
    editorKey.value += 1;
  };

  onBeforeMount(loadArmor);
</script>

<template>
  <page-layout>
    <template #title>Редактирование доспеха</template>

    <div v-if="loading">Загрузка...</div>

    <template v-else-if="armor">
      <armor-editor
        :key="editorKey"
        :armor="armor"
      />

      <workshop-revisions
        v-if="armor.id"
        base-path="/workshop/armors"
        :item-id="armor.id"
        @restored="onRestored"
      />
    </template>

    <div v-else>Доспех не найден.</div>
  </page-layout>
</template>
