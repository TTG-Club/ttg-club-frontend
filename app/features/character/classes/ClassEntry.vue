<script setup lang="ts">
  import { SectionEntry } from '~section/entry';
  import { getWorkshopEditPath } from '~section/model';

  import {
    classDetailSchema,
    CLASSES_SECTION,
    getArchetypeSwipePaths,
  } from '../model';
  import ClassBody from './ClassBody.vue';

  /**
   * Класс или архетип поверх списка раздела; без адреса — страница записи по
   * адресу страницы.
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
    :section="CLASSES_SECTION"
    :schema="classDetailSchema"
    :get-edit-path="getWorkshopEditPath"
    :get-swipe-paths="getArchetypeSwipePaths"
  >
    <template #default="{ entry }">
      <!-- Другой класс или архетип открывается с первой вкладки -->
      <ClassBody
        :key="entryPath"
        :entry="entry"
        :path="entryPath"
      />
    </template>
  </SectionEntry>
</template>
