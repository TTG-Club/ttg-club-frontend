<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { WorkshopAccessGate } from '~workshop/gate';
  import {
    findWorkshopSection,
    getWorkshopCreateRoute,
    WORKSHOP_ICON,
    WORKSHOP_ROUTE,
    WORKSHOP_TEXT,
  } from '~workshop/model';

  definePageMeta({
    layout: 'section',
    // Адреса только разделов, которые уже есть в мастерской
    validate: (route) => !!findWorkshopSection(route.params.section),
  });

  const route = useRoute();

  const section = computed(() => findWorkshopSection(route.params.section));

  const title = computed(
    () => `${WORKSHOP_TEXT.title}: ${section.value?.title ?? ''}`,
  );

  const createTo = computed(() =>
    getWorkshopCreateRoute(section.value?.key ?? ''),
  );

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title,
    robots: 'noindex, nofollow',
  });
</script>

<template>
  <SectionLayout :title="title">
    <WorkshopAccessGate>
      <div
        v-if="section"
        class="flex max-w-2xl flex-col gap-4"
      >
        <p class="text-sm text-muted">
          {{ WORKSHOP_TEXT.sectionHint }}
        </p>

        <div class="flex flex-wrap gap-2">
          <UButton
            :label="WORKSHOP_TEXT.create"
            :icon="WORKSHOP_ICON.create"
            :to="createTo"
          />

          <UButton
            :label="WORKSHOP_TEXT.openReference"
            :icon="WORKSHOP_ICON.reference"
            :to="section.referencePath"
            color="neutral"
            variant="subtle"
          />

          <UButton
            :label="WORKSHOP_TEXT.title"
            :icon="WORKSHOP_ICON.back"
            :to="WORKSHOP_ROUTE"
            color="neutral"
            variant="ghost"
          />
        </div>
      </div>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
