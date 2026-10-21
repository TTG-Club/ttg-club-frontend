<script setup lang="ts">
  import { SectionEntry } from '~section/entry';
  import { getWorkshopEditPath } from '~section/model';

  import { backgroundDetailSchema, BACKGROUNDS_SECTION } from '../model';
  import BackgroundBody from './BackgroundBody.vue';
</script>

<template>
  <SectionEntry
    :section="BACKGROUNDS_SECTION"
    :schema="backgroundDetailSchema"
    :get-edit-path="getWorkshopEditPath"
  >
    <template #default="{ entry }">
      <BackgroundBody :background="entry" />
    </template>
  </SectionEntry>
</template>
