<script setup lang="ts">
  import { ContentRender } from '~content/render';
  import { SectionEntry } from '~section/entry';
  import { SectionSourceBar } from '~section/source-bar';

  import {
    BOOK_SHORT_NAME_LABEL,
    bookDetailSchema,
    BOOKS_SECTION,
  } from '../model';
</script>

<template>
  <!-- Правки в мастерской у книг нет -->
  <SectionEntry
    :section="BOOKS_SECTION"
    :schema="bookDetailSchema"
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
