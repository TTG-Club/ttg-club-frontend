<script setup lang="ts">
  import { BookmarkButton } from '~bookmarks/button';
  import { ContentRender } from '~content/render';
  import { useSectionEntry } from '~section/composables';
  import { SectionDetailPane } from '~section/detail-pane';
  import { SectionSourceBar } from '~section/source-bar';

  import {
    BOOK_SHORT_NAME_LABEL,
    bookDetailSchema,
    BOOKS_SECTION,
  } from '../model';

  /** Открытый источник рядом со списком. Правки в мастерской у книг нет. */
  const route = useRoute();

  const {
    entry: book,
    isLoading,
    isError,
  } = await useSectionEntry({
    key: BOOKS_SECTION.key,
    path: () => route.path,
    schema: bookDetailSchema,
  });

  const closeTo = computed(() => ({
    path: BOOKS_SECTION.path,
    query: route.query,
  }));
</script>

<template>
  <SectionDetailPane
    :title="book?.name.rus ?? ''"
    :subtitle="book?.name.eng"
    :close-to="closeTo"
    :is-loading="isLoading"
    :is-error="isError"
  >
    <template #actions>
      <ClientOnly>
        <BookmarkButton
          v-if="book"
          :url="route.path"
          :name="book.name.rus"
        />
      </ClientOnly>
    </template>

    <template v-if="book">
      <SectionSourceBar :left="book.type.name">
        <template v-if="book.source?.shortName">
          {{ BOOK_SHORT_NAME_LABEL }} {{ book.source.shortName }}
        </template>
      </SectionSourceBar>

      <ContentRender
        v-if="book.description"
        :html="book.description"
      />
    </template>
  </SectionDetailPane>
</template>
