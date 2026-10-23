<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { WorkshopAccessGate } from '~workshop/gate';
  import {
    getWorkshopCreateRoute,
    getWorkshopSectionRoute,
    WORKSHOP_ICON,
    WORKSHOP_SECTIONS,
    WORKSHOP_TEXT,
  } from '~workshop/model';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: WORKSHOP_TEXT.title,
    robots: 'noindex, nofollow',
  });

  const sections = WORKSHOP_SECTIONS.map((section) => ({
    ...section,
    to: getWorkshopSectionRoute(section.key),
    createTo: getWorkshopCreateRoute(section.key),
  }));
</script>

<template>
  <SectionLayout :title="WORKSHOP_TEXT.title">
    <WorkshopAccessGate>
      <div class="flex flex-col gap-4">
        <p class="text-sm text-muted">
          {{ WORKSHOP_TEXT.description }}
        </p>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          <UCard
            v-for="section in sections"
            :key="section.key"
            :ui="{ body: 'flex h-full flex-col gap-4' }"
          >
            <div class="flex flex-1 flex-col gap-2">
              <ULink
                :to="section.to"
                class="flex items-center gap-2 text-lg font-semibold text-highlighted"
              >
                <UIcon
                  :name="section.icon"
                  class="size-5 text-primary"
                />

                {{ section.title }}
              </ULink>

              <p class="text-sm text-muted">
                {{ section.description }}
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <UButton
                :label="WORKSHOP_TEXT.create"
                :icon="WORKSHOP_ICON.create"
                :to="section.createTo"
                size="sm"
              />

              <UButton
                :label="WORKSHOP_TEXT.openReference"
                :icon="WORKSHOP_ICON.reference"
                :to="section.referencePath"
                color="neutral"
                variant="subtle"
                size="sm"
              />
            </div>
          </UCard>
        </div>
      </div>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
