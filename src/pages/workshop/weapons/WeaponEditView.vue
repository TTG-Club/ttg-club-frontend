<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import type { WeaponItem } from '@/shared/types/inventory/Weapons';
  import type { Maybe } from '@/shared/types/Utility';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import PageLayout from '@/layouts/PageLayout.vue';

  import WorkshopRevisions from '../WorkshopRevisions.vue';

  import WeaponEditor from './WeaponEditor.vue';

  const route = useRoute();
  const weapon = ref<Maybe<WeaponItem>>(undefined);
  const loading = ref(true);
  const editorKey = ref(0);

  const loadWeapon = async () => {
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
  };

  const onRestored = async () => {
    await loadWeapon();
    editorKey.value += 1;
  };

  onBeforeMount(loadWeapon);
</script>

<template>
  <page-layout>
    <template #title>Редактирование оружия</template>

    <div v-if="loading">Загрузка...</div>

    <template v-else-if="weapon">
      <weapon-editor
        :key="editorKey"
        :weapon="weapon"
      />

      <workshop-revisions
        v-if="weapon.id"
        base-path="/workshop/weapons"
        :item-id="weapon.id"
        @restored="onRestored"
      />
    </template>

    <div v-else>Оружие не найдено.</div>
  </page-layout>
</template>
