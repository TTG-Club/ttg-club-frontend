<script setup lang="ts">
  import { SectionEntry } from '~section/entry';
  import { getWorkshopEditPath } from '~section/model';

  import { armorDetailSchema, ARMORS_SECTION } from '../model';
  import ArmorBody from './ArmorBody.vue';
</script>

<template>
  <SectionEntry
    :section="ARMORS_SECTION"
    :schema="armorDetailSchema"
    :get-edit-path="getWorkshopEditPath"
  >
    <template #default="{ entry }">
      <ArmorBody :armor="entry" />
    </template>
  </SectionEntry>
</template>
