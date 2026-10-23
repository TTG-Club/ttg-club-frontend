<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { useWorkshopEditPage } from '~workshop/composables';
  import { WorkshopEditFrame } from '~workshop/entry-state';
  import { FeatEditor } from '~workshop/feats';
  import { WorkshopAccessGate } from '~workshop/gate';
  import {
    FEAT_EDITOR_TEXT,
    FEATS_REFERENCE_PATH,
    FEATS_WORKSHOP_KEY,
    fetchReferenceEntry,
    parseWorkshopFeat,
  } from '~workshop/model';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: FEAT_EDITOR_TEXT.editTitle,
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
    sectionKey: FEATS_WORKSHOP_KEY,
    fetchEntry: (slug) =>
      fetchReferenceEntry(`${FEATS_REFERENCE_PATH}/${slug}`),
    parse: parseWorkshopFeat,
  });
</script>

<template>
  <SectionLayout :title="FEAT_EDITOR_TEXT.editTitle">
    <WorkshopAccessGate>
      <!-- Редактор разбирает разметку средствами браузера -->
      <ClientOnly>
        <WorkshopEditFrame
          :api-section="FEATS_WORKSHOP_KEY"
          :entry-id="entry?.id"
          :version="version"
          :is-loading="isLoading"
          :is-not-found="isNotFound"
          :is-error="isError"
          @reload="reload"
        >
          <FeatEditor
            v-if="entry"
            :key="version"
            :feat="entry"
            @saved="handleSaved"
          />
        </WorkshopEditFrame>
      </ClientOnly>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
