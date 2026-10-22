<script setup lang="ts">
  import { SectionEntry } from '~section/entry';
  import { getWorkshopEditPath } from '~section/model';

  import { BESTIARY_SECTION, creatureDetailSchema } from '../model';
  import CreatureBody from './CreatureBody.vue';
</script>

<template>
  <SectionEntry
    :section="BESTIARY_SECTION"
    :schema="creatureDetailSchema"
    :get-edit-path="getWorkshopEditPath"
  >
    <template #default="{ entry }">
      <CreatureBody :creature="entry" />
    </template>
  </SectionEntry>
</template>
