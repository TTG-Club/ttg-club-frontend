<script setup lang="ts">
  import { SectionEntry } from '~section/entry';
  import { getWorkshopEditPath } from '~section/model';

  import { featDetailSchema, FEATS_SECTION } from '../model';
  import FeatBody from './FeatBody.vue';
</script>

<template>
  <SectionEntry
    :section="FEATS_SECTION"
    :schema="featDetailSchema"
    :get-edit-path="getWorkshopEditPath"
  >
    <template #default="{ entry }">
      <FeatBody :feat="entry" />
    </template>
  </SectionEntry>
</template>
