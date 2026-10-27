<script setup lang="ts">
  import { SectionEntry } from '~section/entry';

  import {
    getRaceEditPath,
    getSubraceSwipePaths,
    raceDetailSchema,
    RACES_SECTION,
  } from '../model';
  import RaceBody from './RaceBody.vue';

  /**
   * Запись поверх списка раздела; без адреса — страница записи по адресу
   * страницы.
   */
  const { path = undefined } = defineProps<{
    path?: string;
  }>();

  const route = useRoute();

  const entryPath = computed(() => path ?? route.path);
</script>

<template>
  <SectionEntry
    :path="path"
    :section="RACES_SECTION"
    :schema="raceDetailSchema"
    :get-edit-path="getRaceEditPath"
    :get-swipe-paths="getSubraceSwipePaths"
  >
    <template #default="{ entry }">
      <RaceBody
        :race="entry"
        :path="entryPath"
      />
    </template>
  </SectionEntry>
</template>
