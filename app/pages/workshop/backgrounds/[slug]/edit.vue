<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { BackgroundEditor } from '~workshop/backgrounds';
  import { useWorkshopEditPage } from '~workshop/composables';
  import { WorkshopEditFrame } from '~workshop/entry-state';
  import { WorkshopAccessGate } from '~workshop/gate';
  import {
    BACKGROUND_EDITOR_TEXT,
    BACKGROUNDS_REFERENCE_PATH,
    BACKGROUNDS_WORKSHOP_KEY,
    fetchReferenceEntry,
    parseWorkshopBackground,
  } from '~workshop/model';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: BACKGROUND_EDITOR_TEXT.editTitle,
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
    sectionKey: BACKGROUNDS_WORKSHOP_KEY,
    fetchEntry: (slug) =>
      fetchReferenceEntry(`${BACKGROUNDS_REFERENCE_PATH}/${slug}`),
    parse: parseWorkshopBackground,
  });
</script>

<template>
  <SectionLayout :title="BACKGROUND_EDITOR_TEXT.editTitle">
    <WorkshopAccessGate>
      <!-- Редактор разбирает разметку средствами браузера -->
      <ClientOnly>
        <WorkshopEditFrame
          :api-section="BACKGROUNDS_WORKSHOP_KEY"
          :entry-id="entry?.id"
          :version="version"
          :is-loading="isLoading"
          :is-not-found="isNotFound"
          :is-error="isError"
          @reload="reload"
        >
          <BackgroundEditor
            v-if="entry"
            :key="version"
            :background="entry"
            @saved="handleSaved"
          />
        </WorkshopEditFrame>
      </ClientOnly>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
