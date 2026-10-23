<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { BookEditor } from '~workshop/books';
  import { useWorkshopEditPage } from '~workshop/composables';
  import { WorkshopEditFrame } from '~workshop/entry-state';
  import { WorkshopAccessGate } from '~workshop/gate';
  import {
    BOOK_EDITOR_TEXT,
    BOOKS_WORKSHOP_KEY,
    fetchWorkshopEntry,
    parseWorkshopBook,
  } from '~workshop/model';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: BOOK_EDITOR_TEXT.editTitle,
    robots: 'noindex, nofollow',
  });

  const {
    entry,
    isLoading,
    isNotFound,
    isError,
    version,
    reload,
    handleSaved,
  } = useWorkshopEditPage({
    sectionKey: BOOKS_WORKSHOP_KEY,
    fetchEntry: (slug) => fetchWorkshopEntry(BOOKS_WORKSHOP_KEY, slug),
    parse: parseWorkshopBook,
    isLowercaseSlug: true,
  });
</script>

<template>
  <SectionLayout :title="BOOK_EDITOR_TEXT.editTitle">
    <WorkshopAccessGate>
      <!-- Редактор разбирает разметку средствами браузера -->
      <ClientOnly>
        <!-- Истории изменений у источников нет: ключ книги не число -->
        <WorkshopEditFrame
          :api-section="BOOKS_WORKSHOP_KEY"
          :entry-id="entry?.source"
          :version="version"
          :is-loading="isLoading"
          :is-not-found="isNotFound"
          :is-error="isError"
          :has-revisions="false"
          @reload="reload"
        >
          <BookEditor
            v-if="entry"
            :key="version"
            :book="entry"
            @saved="handleSaved"
          />
        </WorkshopEditFrame>
      </ClientOnly>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
