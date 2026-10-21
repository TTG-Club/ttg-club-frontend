<script setup lang="ts">
  import { SectionEntry } from '~section/entry';
  import { getWorkshopEditPath } from '~section/model';

  import { godDetailSchema, GODS_SECTION } from '../model';
  import GodBody from './GodBody.vue';
</script>

<template>
  <SectionEntry
    :section="GODS_SECTION"
    :schema="godDetailSchema"
    :get-edit-path="getWorkshopEditPath"
  >
    <template #default="{ entry }">
      <GodBody :god="entry" />
    </template>
  </SectionEntry>
</template>
