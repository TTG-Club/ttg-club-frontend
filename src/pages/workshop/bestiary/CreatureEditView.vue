<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import type { Maybe } from '@/shared/types/Utility';
  import type { ICreature } from '@/shared/types/workshop/Bestiary';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import PageLayout from '@/layouts/PageLayout.vue';

  import CreatureEditor from './CreatureEditor.vue';

  const route = useRoute();

  const creature = ref<Maybe<ICreature>>(undefined);
  const loading = ref(true);

  onBeforeMount(async () => {
    try {
      const resp = await httpClient.get<ICreature>({
        url: `/bestiary/${route.params.creatureName}`,
        version: 'v2',
      });

      creature.value = resp.data;
    } catch (err) {
      errorHandler(err);
    } finally {
      loading.value = false;
    }
  });
</script>

<template>
  <page-layout>
    <template #title>Редактирование существа</template>

    <div v-if="loading">Загрузка...</div>

    <creature-editor
      v-else-if="creature"
      :creature="creature"
    />

    <div v-else>Существо не найдено.</div>
  </page-layout>
</template>
