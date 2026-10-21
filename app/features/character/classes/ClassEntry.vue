<script setup lang="ts">
  import { SectionEntry } from '~section/entry';
  import { getWorkshopEditPath } from '~section/model';

  import { classDetailSchema, CLASSES_SECTION } from '../model';
  import ClassBody from './ClassBody.vue';

  const route = useRoute();
</script>

<template>
  <SectionEntry
    :section="CLASSES_SECTION"
    :schema="classDetailSchema"
    :get-edit-path="getWorkshopEditPath"
  >
    <template #default="{ entry }">
      <!-- Другой класс или архетип открывается с первой вкладки -->
      <ClassBody
        :key="route.path"
        :entry="entry"
      />
    </template>
  </SectionEntry>
</template>
