<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { useWorkshopCreatePage } from '~workshop/composables';
  import { WorkshopAccessGate } from '~workshop/gate';
  import { OPTION_EDITOR_TEXT, OPTIONS_WORKSHOP_KEY } from '~workshop/model';
  import { OptionEditor } from '~workshop/options';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: OPTION_EDITOR_TEXT.createTitle,
    robots: 'noindex, nofollow',
  });

  const handleSaved = useWorkshopCreatePage(OPTIONS_WORKSHOP_KEY, true);
</script>

<template>
  <SectionLayout :title="OPTION_EDITOR_TEXT.createTitle">
    <WorkshopAccessGate>
      <!-- Редактор разбирает разметку средствами браузера -->
      <ClientOnly>
        <div class="max-w-5xl">
          <OptionEditor @saved="handleSaved" />
        </div>
      </ClientOnly>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
