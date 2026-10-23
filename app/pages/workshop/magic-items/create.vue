<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { useWorkshopCreatePage } from '~workshop/composables';
  import { WorkshopAccessGate } from '~workshop/gate';
  import { MagicItemEditor } from '~workshop/magic-items';
  import {
    MAGIC_ITEM_EDITOR_TEXT,
    MAGIC_ITEMS_WORKSHOP_KEY,
  } from '~workshop/model';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: MAGIC_ITEM_EDITOR_TEXT.createTitle,
    robots: 'noindex, nofollow',
  });

  const handleSaved = useWorkshopCreatePage(MAGIC_ITEMS_WORKSHOP_KEY);
</script>

<template>
  <SectionLayout :title="MAGIC_ITEM_EDITOR_TEXT.createTitle">
    <WorkshopAccessGate>
      <!-- Редактор разбирает разметку средствами браузера -->
      <ClientOnly>
        <div class="max-w-5xl">
          <MagicItemEditor @saved="handleSaved" />
        </div>
      </ClientOnly>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
