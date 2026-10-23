<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { useWorkshopEditPage } from '~workshop/composables';
  import { WorkshopEditFrame } from '~workshop/entry-state';
  import { WorkshopAccessGate } from '~workshop/gate';
  import {
    fetchReferenceEntry,
    parseWorkshopRule,
    RULE_EDITOR_TEXT,
    RULES_REFERENCE_PATH,
    RULES_WORKSHOP_KEY,
  } from '~workshop/model';
  import { RuleEditor } from '~workshop/rules';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: RULE_EDITOR_TEXT.editTitle,
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
    sectionKey: RULES_WORKSHOP_KEY,
    fetchEntry: (slug) =>
      fetchReferenceEntry(`${RULES_REFERENCE_PATH}/${slug}`),
    parse: parseWorkshopRule,
    isLowercaseSlug: true,
  });
</script>

<template>
  <SectionLayout :title="RULE_EDITOR_TEXT.editTitle">
    <WorkshopAccessGate>
      <!-- Редактор разбирает разметку средствами браузера -->
      <ClientOnly>
        <WorkshopEditFrame
          :api-section="RULES_WORKSHOP_KEY"
          :entry-id="entry?.id"
          :version="version"
          :is-loading="isLoading"
          :is-not-found="isNotFound"
          :is-error="isError"
          @reload="reload"
        >
          <RuleEditor
            v-if="entry"
            :key="version"
            :rule="entry"
            @saved="handleSaved"
          />
        </WorkshopEditFrame>
      </ClientOnly>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
