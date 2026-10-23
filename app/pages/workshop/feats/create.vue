<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { useWorkshopCreatePage } from '~workshop/composables';
  import { FeatEditor } from '~workshop/feats';
  import { WorkshopAccessGate } from '~workshop/gate';
  import { FEAT_EDITOR_TEXT, FEATS_WORKSHOP_KEY } from '~workshop/model';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: FEAT_EDITOR_TEXT.createTitle,
    robots: 'noindex, nofollow',
  });

  const handleSaved = useWorkshopCreatePage(FEATS_WORKSHOP_KEY);
</script>

<template>
  <SectionLayout :title="FEAT_EDITOR_TEXT.createTitle">
    <WorkshopAccessGate>
      <!-- Редактор разбирает разметку средствами браузера -->
      <ClientOnly>
        <div class="max-w-5xl">
          <FeatEditor @saved="handleSaved" />
        </div>
      </ClientOnly>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
