<script setup lang="ts">
  import { SectionEntry } from '~section/entry';
  import { getWorkshopEditPath } from '~section/model';

  import { itemDetailSchema, ITEMS_SECTION } from '../model';
  import ItemBody from './ItemBody.vue';

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
    :section="ITEMS_SECTION"
    :schema="itemDetailSchema"
    :get-edit-path="getWorkshopEditPath"
  >
    <template #default="{ entry }">
      <ItemBody :item="entry" />
    </template>
  </SectionEntry>
</template>
