<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import type { TSpellItem } from '@/shared/types/character/Spells';
  import type { Maybe } from '@/shared/types/Utility';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import PageLayout from '@/layouts/PageLayout.vue';

  import SpellEditor from './SpellEditor.vue';

  const route = useRoute();

  const spell = ref<Maybe<TSpellItem>>(undefined);
  const loading = ref(true);

  onBeforeMount(async () => {
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
  });
</script>

<template>
  <page-layout>
    <template #title>Редактирование заклинания</template>

    <div v-if="loading">Загрузка...</div>

    <spell-editor
      v-else-if="spell"
      :spell="spell"
    />

    <div v-else>Заклинание не найдено.</div>
  </page-layout>
</template>
