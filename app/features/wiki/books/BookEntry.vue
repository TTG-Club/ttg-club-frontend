<script setup lang="ts">
  import { ContentRender } from '~content/render';
  import { SectionEntry } from '~section/entry';
  import { getWorkshopEditPath } from '~section/model';
  import { SectionSourceBar } from '~section/source-bar';

  import {
    BOOK_SHORT_NAME_LABEL,
    bookDetailSchema,
    BOOKS_SECTION,
  } from '../model';

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
    :section="BOOKS_SECTION"
    :schema="bookDetailSchema"
    :get-edit-path="getWorkshopEditPath"
  >
    <template #default="{ entry }">
      <SectionSourceBar :left="entry.type.name">
        <template v-if="entry.source?.shortName">
          {{ BOOK_SHORT_NAME_LABEL }} {{ entry.source.shortName }}
        </template>
      </SectionSourceBar>

      <ContentRender
        v-if="entry.description"
        :html="entry.description"
      />
    </template>
  </SectionEntry>
</template>
