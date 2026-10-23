<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { useWorkshopEditPage } from '~workshop/composables';
  import { WorkshopEditFrame } from '~workshop/entry-state';
  import { WorkshopAccessGate } from '~workshop/gate';
  import { MagicItemEditor } from '~workshop/magic-items';
  import {
    fetchReferenceEntry,
    MAGIC_ITEM_EDITOR_TEXT,
    MAGIC_ITEMS_API_SECTION,
    MAGIC_ITEMS_REFERENCE_PATH,
    MAGIC_ITEMS_WORKSHOP_KEY,
    parseWorkshopMagicItem,
  } from '~workshop/model';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: MAGIC_ITEM_EDITOR_TEXT.editTitle,
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
    sectionKey: MAGIC_ITEMS_WORKSHOP_KEY,
    fetchEntry: (slug) =>
      fetchReferenceEntry(`${MAGIC_ITEMS_REFERENCE_PATH}/${slug}`),
    parse: parseWorkshopMagicItem,
  });
</script>

<template>
  <SectionLayout :title="MAGIC_ITEM_EDITOR_TEXT.editTitle">
    <WorkshopAccessGate>
      <!-- Редактор разбирает разметку средствами браузера -->
      <ClientOnly>
        <WorkshopEditFrame
          :api-section="MAGIC_ITEMS_API_SECTION"
          :entry-id="entry?.id"
          :version="version"
          :is-loading="isLoading"
          :is-not-found="isNotFound"
          :is-error="isError"
          @reload="reload"
        >
          <MagicItemEditor
            v-if="entry"
            :key="version"
            :magic-item="entry"
            @saved="handleSaved"
          />
        </WorkshopEditFrame>
      </ClientOnly>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
