<script setup lang="ts">
  import { SectionEntry } from '~section/entry';
  import { getWorkshopEditPath } from '~section/model';

  import { weaponDetailSchema, WEAPONS_SECTION } from '../model';
  import WeaponBody from './WeaponBody.vue';
</script>

<template>
  <SectionEntry
    :section="WEAPONS_SECTION"
    :schema="weaponDetailSchema"
    :get-edit-path="getWorkshopEditPath"
  >
    <template #default="{ entry }">
      <WeaponBody :weapon="entry" />
    </template>
  </SectionEntry>
</template>
