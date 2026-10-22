<script setup lang="ts">
  import { SectionEntry } from '~section/entry';
  import { getWorkshopEditPath } from '~section/model';

  import { backgroundDetailSchema, BACKGROUNDS_SECTION } from '../model';
  import BackgroundBody from './BackgroundBody.vue';

  /**
   * Запись поверх списка раздела; без адреса — страница записи по адресу
   * страницы.
   */
  const { path = undefined } = defineProps<{
    path?: string;
  }>();
</script>

<template>
  <SectionEntry
    :path="path"
    :section="BACKGROUNDS_SECTION"
    :schema="backgroundDetailSchema"
    :get-edit-path="getWorkshopEditPath"
  >
    <template #default="{ entry }">
      <BackgroundBody :background="entry" />
    </template>
  </SectionEntry>
</template>
