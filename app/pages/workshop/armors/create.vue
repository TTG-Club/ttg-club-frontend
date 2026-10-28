<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { ArmorEditor } from '~workshop/armors';
  import { useWorkshopCreatePage } from '~workshop/composables';
  import { WorkshopAccessGate } from '~workshop/gate';
  import { ARMOR_EDITOR_TEXT, ARMORS_WORKSHOP_KEY } from '~workshop/model';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: ARMOR_EDITOR_TEXT.createTitle,
    robots: 'noindex, nofollow',
  });

  const handleSaved = useWorkshopCreatePage(ARMORS_WORKSHOP_KEY);
</script>

<template>
  <SectionLayout :title="ARMOR_EDITOR_TEXT.createTitle">
    <WorkshopAccessGate>
      <!-- Редактор разбирает разметку средствами браузера -->
      <ClientOnly>
        <div class="max-w-5xl">
          <ArmorEditor @saved="handleSaved" />
        </div>
      </ClientOnly>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
