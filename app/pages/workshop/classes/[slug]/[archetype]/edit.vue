<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { ArchetypeEditor } from '~workshop/classes';
  import { useWorkshopEditPage } from '~workshop/composables';
  import { WorkshopEditFrame } from '~workshop/entry-state';
  import { WorkshopAccessGate } from '~workshop/gate';
  import {
    ARCHETYPE_EDITOR_TEXT,
    ARCHETYPES_API_SECTION,
    CLASSES_WORKSHOP_KEY,
    fetchWorkshopArchetype,
    getArchetypeEditRoute,
    getArchetypeReferencePath,
    getRouteSlug,
    parseWorkshopArchetype,
  } from '~workshop/model';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: ARCHETYPE_EDITOR_TEXT.editTitle,
    robots: 'noindex, nofollow',
  });

  const route = useRoute();

  const classSlug = computed(() => getRouteSlug(route.params.slug) ?? '');

  const {
    entry,
    isLoading,
    isNotFound,
    isError,
    version,
    slug,
    reload,
    handleSaved,
  } = useWorkshopEditPage({
    sectionKey: CLASSES_WORKSHOP_KEY,
    fetchEntry: (archetypeSlug) =>
      fetchWorkshopArchetype(classSlug.value, archetypeSlug),
    parse: parseWorkshopArchetype,
    isLowercaseSlug: true,
    slugParam: 'archetype',
    getEditRoute: (archetypeSlug) =>
      getArchetypeEditRoute(classSlug.value, archetypeSlug),
  });

  const cancelTo = computed(() =>
    getArchetypeReferencePath(classSlug.value, slug.value),
  );
</script>

<template>
  <SectionLayout :title="ARCHETYPE_EDITOR_TEXT.editTitle">
    <WorkshopAccessGate>
      <!-- Редактор разбирает разметку средствами браузера -->
      <ClientOnly>
        <WorkshopEditFrame
          :api-section="ARCHETYPES_API_SECTION"
          :entry-id="entry?.id"
          :version="version"
          :is-loading="isLoading"
          :is-not-found="isNotFound"
          :is-error="isError"
          @reload="reload"
        >
          <ArchetypeEditor
            v-if="entry"
            :key="version"
            :archetype="entry"
            :cancel-to="cancelTo"
            @saved="handleSaved"
          />
        </WorkshopEditFrame>
      </ClientOnly>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
