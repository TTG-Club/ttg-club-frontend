<script setup lang="ts">
  import { SectionEntry } from '~section/entry';
  import { getWorkshopEditPath } from '~section/model';

  import { itemDetailSchema, ITEMS_SECTION } from '../model';
  import ItemBody from './ItemBody.vue';
</script>

<template>
  <SectionEntry
    :section="ITEMS_SECTION"
    :schema="itemDetailSchema"
    :get-edit-path="getWorkshopEditPath"
  >
    <template #default="{ entry }">
      <ItemBody :item="entry" />
    </template>
  </SectionEntry>
</template>
