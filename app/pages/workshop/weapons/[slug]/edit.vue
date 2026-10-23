<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { useWorkshopEditPage } from '~workshop/composables';
  import { WorkshopEditFrame } from '~workshop/entry-state';
  import { WorkshopAccessGate } from '~workshop/gate';
  import {
    fetchReferenceEntry,
    parseWorkshopWeapon,
    WEAPON_EDITOR_TEXT,
    WEAPONS_REFERENCE_PATH,
    WEAPONS_WORKSHOP_KEY,
  } from '~workshop/model';
  import { WeaponEditor } from '~workshop/weapons';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: WEAPON_EDITOR_TEXT.editTitle,
    robots: 'noindex, nofollow',
  });

  const {
    entry,
    isLoading,
    isNotFound,
    isError,
    version,
    reload,
    handleSaved,
  } = useWorkshopEditPage({
    sectionKey: WEAPONS_WORKSHOP_KEY,
    fetchEntry: (slug) =>
      fetchReferenceEntry(`${WEAPONS_REFERENCE_PATH}/${slug}`),
    parse: parseWorkshopWeapon,
  });
</script>

<template>
  <SectionLayout :title="WEAPON_EDITOR_TEXT.editTitle">
    <WorkshopAccessGate>
      <!-- Редактор разбирает разметку средствами браузера -->
      <ClientOnly>
        <WorkshopEditFrame
          :api-section="WEAPONS_WORKSHOP_KEY"
          :entry-id="entry?.id"
          :version="version"
          :is-loading="isLoading"
          :is-not-found="isNotFound"
          :is-error="isError"
          @reload="reload"
        >
          <WeaponEditor
            v-if="entry"
            :key="version"
            :weapon="entry"
            @saved="handleSaved"
          />
        </WorkshopEditFrame>
      </ClientOnly>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
