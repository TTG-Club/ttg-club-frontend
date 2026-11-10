<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { ClassEditor } from '~workshop/classes';
  import { useWorkshopEditPage } from '~workshop/composables';
  import { WorkshopEditFrame } from '~workshop/entry-state';
  import { WorkshopAccessGate } from '~workshop/gate';
  import {
    CLASS_EDITOR_TEXT,
    CLASSES_REFERENCE_PATH,
    CLASSES_WORKSHOP_KEY,
    fetchReferenceEntry,
    parseWorkshopClass,
  } from '~workshop/model';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: CLASS_EDITOR_TEXT.editTitle,
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
    sectionKey: CLASSES_WORKSHOP_KEY,
    fetchEntry: (slug) =>
      fetchReferenceEntry(`${CLASSES_REFERENCE_PATH}/${slug}`),
    parse: parseWorkshopClass,
    isLowercaseSlug: true,
  });
</script>

<template>
  <SectionLayout :title="CLASS_EDITOR_TEXT.editTitle">
    <WorkshopAccessGate>
      <!-- Редактор разбирает разметку средствами браузера -->
      <ClientOnly>
        <WorkshopEditFrame
          :api-section="CLASSES_WORKSHOP_KEY"
          :entry-id="entry?.id"
          :version="version"
          :is-loading="isLoading"
          :is-not-found="isNotFound"
          :is-error="isError"
          @reload="reload"
        >
          <ClassEditor
            v-if="entry"
            :key="version"
            :hero-class="entry"
            @saved="handleSaved"
          />
        </WorkshopEditFrame>
      </ClientOnly>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
