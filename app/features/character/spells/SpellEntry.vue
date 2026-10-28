<script setup lang="ts">
  import { SectionEntry } from '~section/entry';
  import { getWorkshopEditPath } from '~section/model';

  import { spellDetailSchema, SPELLS_SECTION } from '../model';
  import SpellBody from './SpellBody.vue';

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
    :section="SPELLS_SECTION"
    :schema="spellDetailSchema"
    :get-edit-path="getWorkshopEditPath"
  >
    <template #default="{ entry }">
      <SpellBody :spell="entry" />
    </template>
  </SectionEntry>
</template>
