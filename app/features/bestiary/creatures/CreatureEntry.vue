<script setup lang="ts">
  import { SectionEntry } from '~section/entry';
  import { getWorkshopEditPath } from '~section/model';

  import { BESTIARY_SECTION, creatureDetailSchema } from '../model';
  import CreatureBody from './CreatureBody.vue';

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
    :section="BESTIARY_SECTION"
    :schema="creatureDetailSchema"
    :get-edit-path="getWorkshopEditPath"
  >
    <template #default="{ entry }">
      <CreatureBody :creature="entry" />
    </template>
  </SectionEntry>
</template>
