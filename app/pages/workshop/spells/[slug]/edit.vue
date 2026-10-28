<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { useWorkshopEditPage } from '~workshop/composables';
  import { WorkshopEditFrame } from '~workshop/entry-state';
  import { WorkshopAccessGate } from '~workshop/gate';
  import {
    fetchReferenceEntry,
    parseWorkshopSpell,
    SPELL_EDITOR_TEXT,
    SPELLS_REFERENCE_PATH,
    SPELLS_WORKSHOP_KEY,
  } from '~workshop/model';
  import { SpellEditor } from '~workshop/spells';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: SPELL_EDITOR_TEXT.editTitle,
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
    sectionKey: SPELLS_WORKSHOP_KEY,
    fetchEntry: (slug) =>
      fetchReferenceEntry(`${SPELLS_REFERENCE_PATH}/${slug}`),
    parse: parseWorkshopSpell,
  });
</script>

<template>
  <SectionLayout :title="SPELL_EDITOR_TEXT.editTitle">
    <WorkshopAccessGate>
      <!-- Редактор разбирает разметку средствами браузера -->
      <ClientOnly>
        <WorkshopEditFrame
          :api-section="SPELLS_WORKSHOP_KEY"
          :entry-id="entry?.id"
          :version="version"
          :is-loading="isLoading"
          :is-not-found="isNotFound"
          :is-error="isError"
          @reload="reload"
        >
          <SpellEditor
            v-if="entry"
            :key="version"
            :spell="entry"
            @saved="handleSaved"
          />
        </WorkshopEditFrame>
      </ClientOnly>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
