<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { ArmorEditor } from '~workshop/armors';
  import { useWorkshopEditPage } from '~workshop/composables';
  import { WorkshopEditFrame } from '~workshop/entry-state';
  import { WorkshopAccessGate } from '~workshop/gate';
  import {
    ARMOR_EDITOR_TEXT,
    ARMORS_REFERENCE_PATH,
    ARMORS_WORKSHOP_KEY,
    fetchReferenceEntry,
    parseWorkshopArmor,
  } from '~workshop/model';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: ARMOR_EDITOR_TEXT.editTitle,
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
    sectionKey: ARMORS_WORKSHOP_KEY,
    fetchEntry: (slug) =>
      fetchReferenceEntry(`${ARMORS_REFERENCE_PATH}/${slug}`),
    parse: parseWorkshopArmor,
  });
</script>

<template>
  <SectionLayout :title="ARMOR_EDITOR_TEXT.editTitle">
    <WorkshopAccessGate>
      <!-- Редактор разбирает разметку средствами браузера -->
      <ClientOnly>
        <WorkshopEditFrame
          :api-section="ARMORS_WORKSHOP_KEY"
          :entry-id="entry?.id"
          :version="version"
          :is-loading="isLoading"
          :is-not-found="isNotFound"
          :is-error="isError"
          @reload="reload"
        >
          <ArmorEditor
            v-if="entry"
            :key="version"
            :armor="entry"
            @saved="handleSaved"
          />
        </WorkshopEditFrame>
      </ClientOnly>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
