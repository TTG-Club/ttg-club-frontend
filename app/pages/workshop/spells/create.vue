<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { useWorkshopCreatePage } from '~workshop/composables';
  import { WorkshopAccessGate } from '~workshop/gate';
  import { SPELL_EDITOR_TEXT, SPELLS_WORKSHOP_KEY } from '~workshop/model';
  import { SpellEditor } from '~workshop/spells';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: SPELL_EDITOR_TEXT.createTitle,
    robots: 'noindex, nofollow',
  });

  const handleSaved = useWorkshopCreatePage(SPELLS_WORKSHOP_KEY);
</script>

<template>
  <SectionLayout :title="SPELL_EDITOR_TEXT.createTitle">
    <WorkshopAccessGate>
      <!-- Редактор разбирает разметку средствами браузера -->
      <ClientOnly>
        <div class="max-w-5xl">
          <SpellEditor @saved="handleSaved" />
        </div>
      </ClientOnly>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
