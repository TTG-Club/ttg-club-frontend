<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { useWorkshopEditPage } from '~workshop/composables';
  import { WorkshopEditFrame } from '~workshop/entry-state';
  import { WorkshopAccessGate } from '~workshop/gate';
  import {
    fetchReferenceEntry,
    parseWorkshopRace,
    RACE_EDITOR_TEXT,
    RACES_REFERENCE_PATH,
    RACES_WORKSHOP_KEY,
  } from '~workshop/model';
  import { RaceEditor } from '~workshop/races';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: RACE_EDITOR_TEXT.editTitle,
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
    sectionKey: RACES_WORKSHOP_KEY,
    fetchEntry: (slug) =>
      fetchReferenceEntry(`${RACES_REFERENCE_PATH}/${slug}`),
    parse: parseWorkshopRace,
    isLowercaseSlug: true,
  });
</script>

<template>
  <SectionLayout :title="RACE_EDITOR_TEXT.editTitle">
    <WorkshopAccessGate>
      <!-- Редактор разбирает разметку средствами браузера -->
      <ClientOnly>
        <WorkshopEditFrame
          :api-section="RACES_WORKSHOP_KEY"
          :entry-id="entry?.id"
          :version="version"
          :is-loading="isLoading"
          :is-not-found="isNotFound"
          :is-error="isError"
          @reload="reload"
        >
          <RaceEditor
            v-if="entry"
            :key="version"
            :race="entry"
            @saved="handleSaved"
          />
        </WorkshopEditFrame>
      </ClientOnly>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
