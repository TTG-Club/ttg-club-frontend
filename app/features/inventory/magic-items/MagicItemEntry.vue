<script setup lang="ts">
  import { SectionEntry } from '~section/entry';

  import {
    getMagicItemEditPath,
    MAGIC_ITEMS_SECTION,
    magicItemDetailSchema,
  } from '../model';
  import MagicItemBody from './MagicItemBody.vue';
</script>

<template>
  <SectionEntry
    :section="MAGIC_ITEMS_SECTION"
    :schema="magicItemDetailSchema"
    :get-edit-path="getMagicItemEditPath"
  >
    <template #default="{ entry }">
      <MagicItemBody :item="entry" />
    </template>
  </SectionEntry>
</template>
