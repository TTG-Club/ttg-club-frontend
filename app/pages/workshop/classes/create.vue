<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { ClassEditor } from '~workshop/classes';
  import { useWorkshopCreatePage } from '~workshop/composables';
  import { WorkshopAccessGate } from '~workshop/gate';
  import { CLASS_EDITOR_TEXT, CLASSES_WORKSHOP_KEY } from '~workshop/model';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: CLASS_EDITOR_TEXT.createTitle,
    robots: 'noindex, nofollow',
  });

  const handleSaved = useWorkshopCreatePage(CLASSES_WORKSHOP_KEY, true);
</script>

<template>
  <SectionLayout :title="CLASS_EDITOR_TEXT.createTitle">
    <WorkshopAccessGate>
      <!-- Редактор разбирает разметку средствами браузера -->
      <ClientOnly>
        <div class="max-w-5xl">
          <ClassEditor @saved="handleSaved" />
        </div>
      </ClientOnly>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
