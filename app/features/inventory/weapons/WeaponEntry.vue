<script setup lang="ts">
  import { SectionEntry } from '~section/entry';
  import { getWorkshopEditPath } from '~section/model';

  import { weaponDetailSchema, WEAPONS_SECTION } from '../model';
  import WeaponBody from './WeaponBody.vue';

  /**
   * Запись поверх списка раздела; без адреса — страница записи по адресу
   * страницы.
   */
  const { path = undefined } = defineProps<{
    path?: string;
  }>();
</script>

<template>
  <SectionEntry
    :path="path"
    :section="WEAPONS_SECTION"
    :schema="weaponDetailSchema"
    :get-edit-path="getWorkshopEditPath"
  >
    <template #default="{ entry }">
      <WeaponBody :weapon="entry" />
    </template>
  </SectionEntry>
</template>
