<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { useWorkshopEditPage } from '~workshop/composables';
  import { WorkshopEditFrame } from '~workshop/entry-state';
  import { WorkshopAccessGate } from '~workshop/gate';
  import {
    fetchReferenceEntry,
    OPTION_EDITOR_TEXT,
    OPTIONS_REFERENCE_PATH,
    OPTIONS_WORKSHOP_KEY,
    parseWorkshopOption,
  } from '~workshop/model';
  import { OptionEditor } from '~workshop/options';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: OPTION_EDITOR_TEXT.editTitle,
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
    sectionKey: OPTIONS_WORKSHOP_KEY,
    fetchEntry: (slug) =>
      fetchReferenceEntry(`${OPTIONS_REFERENCE_PATH}/${slug}`),
    parse: parseWorkshopOption,
    isLowercaseSlug: true,
  });
</script>

<template>
  <SectionLayout :title="OPTION_EDITOR_TEXT.editTitle">
    <WorkshopAccessGate>
      <!-- Редактор разбирает разметку средствами браузера -->
      <ClientOnly>
        <WorkshopEditFrame
          :api-section="OPTIONS_WORKSHOP_KEY"
          :entry-id="entry?.id"
          :version="version"
          :is-loading="isLoading"
          :is-not-found="isNotFound"
          :is-error="isError"
          @reload="reload"
        >
          <OptionEditor
            v-if="entry"
            :key="version"
            :option="entry"
            @saved="handleSaved"
          />
        </WorkshopEditFrame>
      </ClientOnly>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
