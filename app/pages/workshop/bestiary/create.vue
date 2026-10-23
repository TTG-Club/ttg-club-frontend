<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { CreatureEditor } from '~workshop/bestiary';
  import { useWorkshopCreatePage } from '~workshop/composables';
  import { WorkshopAccessGate } from '~workshop/gate';
  import { BESTIARY_WORKSHOP_KEY, CREATURE_EDITOR_TEXT } from '~workshop/model';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: CREATURE_EDITOR_TEXT.createTitle,
    robots: 'noindex, nofollow',
  });

  const handleSaved = useWorkshopCreatePage(BESTIARY_WORKSHOP_KEY, true);
</script>

<template>
  <SectionLayout :title="CREATURE_EDITOR_TEXT.createTitle">
    <WorkshopAccessGate>
      <!-- Редактор разбирает разметку средствами браузера -->
      <ClientOnly>
        <div class="max-w-5xl">
          <CreatureEditor @saved="handleSaved" />
        </div>
      </ClientOnly>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
