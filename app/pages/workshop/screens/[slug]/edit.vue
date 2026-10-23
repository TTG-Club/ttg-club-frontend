<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { useWorkshopEditPage } from '~workshop/composables';
  import { WorkshopEditFrame } from '~workshop/entry-state';
  import { WorkshopAccessGate } from '~workshop/gate';
  import {
    fetchReferenceEntry,
    parseWorkshopScreen,
    SCREEN_EDITOR_TEXT,
    SCREENS_REFERENCE_PATH,
    SCREENS_WORKSHOP_KEY,
  } from '~workshop/model';
  import { ScreenEditor } from '~workshop/screens';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: SCREEN_EDITOR_TEXT.editTitle,
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
    sectionKey: SCREENS_WORKSHOP_KEY,
    fetchEntry: (slug) =>
      fetchReferenceEntry(`${SCREENS_REFERENCE_PATH}/${slug}`),
    parse: parseWorkshopScreen,
    isLowercaseSlug: true,
  });
</script>

<template>
  <SectionLayout :title="SCREEN_EDITOR_TEXT.editTitle">
    <WorkshopAccessGate>
      <!-- Редактор разбирает разметку средствами браузера -->
      <ClientOnly>
        <WorkshopEditFrame
          :api-section="SCREENS_WORKSHOP_KEY"
          :entry-id="entry?.id"
          :version="version"
          :is-loading="isLoading"
          :is-not-found="isNotFound"
          :is-error="isError"
          @reload="reload"
        >
          <ScreenEditor
            v-if="entry"
            :key="version"
            :screen="entry"
            @saved="handleSaved"
          />
        </WorkshopEditFrame>
      </ClientOnly>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
