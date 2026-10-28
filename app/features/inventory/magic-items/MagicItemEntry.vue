<script setup lang="ts">
  import { SectionEntry } from '~section/entry';

  import {
    getMagicItemEditPath,
    MAGIC_ITEMS_SECTION,
    magicItemDetailSchema,
  } from '../model';
  import MagicItemBody from './MagicItemBody.vue';

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
    :section="MAGIC_ITEMS_SECTION"
    :schema="magicItemDetailSchema"
    :get-edit-path="getMagicItemEditPath"
  >
    <template #default="{ entry }">
      <MagicItemBody :item="entry" />
    </template>
  </SectionEntry>
</template>
