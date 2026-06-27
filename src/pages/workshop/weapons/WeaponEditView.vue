<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import type { WeaponItem } from '@/shared/types/inventory/Weapons';
  import type { Maybe } from '@/shared/types/Utility';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import PageLayout from '@/layouts/PageLayout.vue';

  import WeaponEditor from './WeaponEditor.vue';

  const route = useRoute();
  const weapon = ref<Maybe<WeaponItem>>(undefined);
  const loading = ref(true);

  onBeforeMount(async () => {
    try {
      const resp = await httpClient.post<WeaponItem>({
        url: `/weapons/${route.params.weaponName}`,
      });

      weapon.value = resp.data;
    } catch (err) {
      errorHandler(err);
    } finally {
      loading.value = false;
    }
  });
</script>

<template>
  <page-layout>
    <template #title>Редактирование оружия</template>

    <div v-if="loading">Загрузка...</div>

    <weapon-editor
      v-else-if="weapon"
      :weapon="weapon"
    />

    <div v-else>Оружие не найдено.</div>
  </page-layout>
</template>
