<script setup lang="ts">
  import { SectionEntry } from '~section/entry';
  import { getWorkshopEditPath } from '~section/model';

  import { optionDetailSchema, OPTIONS_SECTION } from '../model';
  import OptionBody from './OptionBody.vue';
</script>

<template>
  <SectionEntry
    :section="OPTIONS_SECTION"
    :schema="optionDetailSchema"
    :get-edit-path="getWorkshopEditPath"
  >
    <template #default="{ entry }">
      <OptionBody :option="entry" />
    </template>
  </SectionEntry>
</template>
