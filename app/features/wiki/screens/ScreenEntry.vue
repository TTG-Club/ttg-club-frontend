<script setup lang="ts">
  import { SectionEntry } from '~section/entry';
  import { getWorkshopEditPath } from '~section/model';

  import { screenDetailSchema, SCREENS_SECTION } from '../model';
  import ScreenBody from './ScreenBody.vue';
  import ScreenGroups from './ScreenGroups.vue';
</script>

<template>
  <SectionEntry
    :section="SCREENS_SECTION"
    :schema="screenDetailSchema"
    :get-edit-path="getWorkshopEditPath"
  >
    <template #default="{ entry }">
      <ScreenGroups
        v-if="entry.chields?.length"
        :screen="entry"
      />

      <ScreenBody
        v-else
        :screen="entry"
      />
    </template>
  </SectionEntry>
</template>
