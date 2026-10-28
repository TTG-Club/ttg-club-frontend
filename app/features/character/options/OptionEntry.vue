<script setup lang="ts">
  import { SectionEntry } from '~section/entry';
  import { getWorkshopEditPath } from '~section/model';

  import { optionDetailSchema, OPTIONS_SECTION } from '../model';
  import OptionBody from './OptionBody.vue';

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
    :section="OPTIONS_SECTION"
    :schema="optionDetailSchema"
    :get-edit-path="getWorkshopEditPath"
  >
    <template #default="{ entry }">
      <OptionBody :option="entry" />
    </template>
  </SectionEntry>
</template>
