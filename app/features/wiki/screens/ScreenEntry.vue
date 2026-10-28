<script setup lang="ts">
  import { SectionEntry } from '~section/entry';
  import { getWorkshopEditPath } from '~section/model';

  import { screenDetailSchema, SCREENS_SECTION } from '../model';
  import ScreenBody from './ScreenBody.vue';
  import ScreenGroups from './ScreenGroups.vue';

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
