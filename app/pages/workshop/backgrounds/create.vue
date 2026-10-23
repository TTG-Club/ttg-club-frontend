<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { BackgroundEditor } from '~workshop/backgrounds';
  import { useWorkshopCreatePage } from '~workshop/composables';
  import { WorkshopAccessGate } from '~workshop/gate';
  import {
    BACKGROUND_EDITOR_TEXT,
    BACKGROUNDS_WORKSHOP_KEY,
  } from '~workshop/model';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: BACKGROUND_EDITOR_TEXT.createTitle,
    robots: 'noindex, nofollow',
  });

  const handleSaved = useWorkshopCreatePage(BACKGROUNDS_WORKSHOP_KEY);
</script>

<template>
  <SectionLayout :title="BACKGROUND_EDITOR_TEXT.createTitle">
    <WorkshopAccessGate>
      <!-- Редактор разбирает разметку средствами браузера -->
      <ClientOnly>
        <div class="max-w-5xl">
          <BackgroundEditor @saved="handleSaved" />
        </div>
      </ClientOnly>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
