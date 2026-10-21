<script setup lang="ts">
  import { SectionEntry } from '~section/entry';

  import { getRaceEditPath, raceDetailSchema, RACES_SECTION } from '../model';
  import RaceBody from './RaceBody.vue';
</script>

<template>
  <SectionEntry
    :section="RACES_SECTION"
    :schema="raceDetailSchema"
    :get-edit-path="getRaceEditPath"
  >
    <template #default="{ entry }">
      <RaceBody :race="entry" />
    </template>
  </SectionEntry>
</template>
