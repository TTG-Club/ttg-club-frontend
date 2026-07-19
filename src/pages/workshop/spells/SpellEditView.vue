<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import type { TSpellItem } from '@/shared/types/character/Spells';
  import type { Maybe } from '@/shared/types/Utility';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import PageLayout from '@/layouts/PageLayout.vue';

  import WorkshopRevisions from '../WorkshopRevisions.vue';

  import SpellEditor from './SpellEditor.vue';

  const route = useRoute();

  const spell = ref<Maybe<TSpellItem>>(undefined);
  const loading = ref(true);
  const editorKey = ref(0);

  const loadSpell = async () => {
    try {
      const resp = await httpClient.post<TSpellItem>({
        url: `/spells/${route.params.spellName}`,
      });

      spell.value = resp.data;
    } catch (err) {
      errorHandler(err);
    } finally {
      loading.value = false;
    }
  };

  const onRestored = async () => {
    await loadSpell();
    editorKey.value += 1;
  };

  onBeforeMount(loadSpell);
</script>

<template>
  <page-layout>
    <template #title>Редактирование заклинания</template>

    <div v-if="loading">Загрузка...</div>

    <template v-else-if="spell">
      <spell-editor
        :key="editorKey"
        :spell="spell"
      />

      <workshop-revisions
        v-if="spell.id"
        base-path="/workshop/spells"
        :item-id="spell.id"
        @restored="onRestored"
      />
    </template>

    <div v-else>Заклинание не найдено.</div>
  </page-layout>
</template>
