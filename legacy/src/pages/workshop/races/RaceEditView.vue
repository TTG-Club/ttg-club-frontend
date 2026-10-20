<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import type { TRaceDetail } from '@/shared/types/character/Races';
  import type { Maybe } from '@/shared/types/Utility';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import PageLayout from '@/layouts/PageLayout.vue';

  import WorkshopRevisions from '../WorkshopRevisions.vue';

  import RaceEditor from './RaceEditor.vue';

  const route = useRoute();
  const race = ref<Maybe<TRaceDetail>>(undefined);
  const loading = ref(true);
  const editorKey = ref(0);

  const loadRace = async () => {
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
  };

  const onRestored = async () => {
    await loadRace();
    editorKey.value += 1;
  };

  onBeforeMount(loadRace);
</script>

<template>
  <page-layout>
    <template #title>Редактирование расы</template>

    <div v-if="loading">Загрузка...</div>

    <template v-else-if="race">
      <race-editor
        :key="editorKey"
        :race="race"
      />

      <workshop-revisions
        v-if="race.id"
        base-path="/workshop/races"
        :item-id="race.id"
        @restored="onRestored"
      />
    </template>

    <div v-else>Раса не найдена.</div>
  </page-layout>
</template>
