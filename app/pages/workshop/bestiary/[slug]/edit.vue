<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { CreatureEditor } from '~workshop/bestiary';
  import { useWorkshopEditPage } from '~workshop/composables';
  import { WorkshopEditFrame } from '~workshop/entry-state';
  import { WorkshopAccessGate } from '~workshop/gate';
  import {
    BESTIARY_WORKSHOP_KEY,
    CREATURE_EDITOR_TEXT,
    fetchWorkshopCreature,
    parseWorkshopCreature,
  } from '~workshop/model';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: CREATURE_EDITOR_TEXT.editTitle,
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
    sectionKey: BESTIARY_WORKSHOP_KEY,
    fetchEntry: fetchWorkshopCreature,
    parse: parseWorkshopCreature,
    isLowercaseSlug: true,
  });
</script>

<template>
  <SectionLayout :title="CREATURE_EDITOR_TEXT.editTitle">
    <WorkshopAccessGate>
      <!-- Редактор разбирает разметку средствами браузера -->
      <ClientOnly>
        <!-- У существ нет истории изменений -->
        <WorkshopEditFrame
          :api-section="BESTIARY_WORKSHOP_KEY"
          :entry-id="entry?.id"
          :version="version"
          :is-loading="isLoading"
          :is-not-found="isNotFound"
          :is-error="isError"
          :has-revisions="false"
          @reload="reload"
        >
          <CreatureEditor
            v-if="entry"
            :key="version"
            :creature="entry"
            @saved="handleSaved"
          />
        </WorkshopEditFrame>
      </ClientOnly>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
