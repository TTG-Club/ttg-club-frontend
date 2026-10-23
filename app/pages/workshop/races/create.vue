<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { useWorkshopCreatePage } from '~workshop/composables';
  import { WorkshopAccessGate } from '~workshop/gate';
  import { RACE_EDITOR_TEXT, RACES_WORKSHOP_KEY } from '~workshop/model';
  import { RaceEditor } from '~workshop/races';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: RACE_EDITOR_TEXT.createTitle,
    robots: 'noindex, nofollow',
  });

  const handleSaved = useWorkshopCreatePage(RACES_WORKSHOP_KEY, true);
</script>

<template>
  <SectionLayout :title="RACE_EDITOR_TEXT.createTitle">
    <WorkshopAccessGate>
      <!-- Редактор разбирает разметку средствами браузера -->
      <ClientOnly>
        <div class="max-w-5xl">
          <RaceEditor @saved="handleSaved" />
        </div>
      </ClientOnly>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
