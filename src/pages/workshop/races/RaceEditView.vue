<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import type { TRaceDetail } from '@/shared/types/character/Races';
  import type { Maybe } from '@/shared/types/Utility';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import PageLayout from '@/layouts/PageLayout.vue';

  import RaceEditor from './RaceEditor.vue';

  const route = useRoute();
  const race = ref<Maybe<TRaceDetail>>(undefined);
  const loading = ref(true);

  onBeforeMount(async () => {
    try {
      const resp = await httpClient.post<TRaceDetail>({
        url: `/races/${route.params.raceName}`,
        payload: {},
      });

      race.value = resp.data;
    } catch (err) {
      errorHandler(err);
    } finally {
      loading.value = false;
    }
  });
</script>

<template>
  <page-layout>
    <template #title>Редактирование расы</template>

    <div v-if="loading">Загрузка...</div>

    <race-editor
      v-else-if="race"
      :race="race"
    />

    <div v-else>Раса не найдена.</div>
  </page-layout>
</template>
