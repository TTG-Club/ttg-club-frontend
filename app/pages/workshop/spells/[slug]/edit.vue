<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { useWorkshopEntry } from '~workshop/composables';
  import { WorkshopEntryState } from '~workshop/entry-state';
  import { WorkshopAccessGate } from '~workshop/gate';
  import {
    getRouteSlug,
    getWorkshopEditRoute,
    getWorkshopSlug,
    parseWorkshopSpell,
    SPELL_EDITOR_TEXT,
    SPELLS_REFERENCE_PATH,
    SPELLS_WORKSHOP_KEY,
  } from '~workshop/model';
  import { WorkshopRevisions } from '~workshop/revisions';
  import { SpellEditor } from '~workshop/spells';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: SPELL_EDITOR_TEXT.editTitle,
    robots: 'noindex, nofollow',
  });

  const route = useRoute();

  const slug = computed(() => getRouteSlug(route.params.slug) ?? '');

  const { entry, isLoading, isNotFound, isError, load } = useWorkshopEntry(
    () => `${SPELLS_REFERENCE_PATH}/${slug.value}`,
    parseWorkshopSpell,
  );

  // Форма и история пересоздаются, когда запись перечитана с сервера
  const version = ref(0);

  async function reload(): Promise<void> {
    await load();
    version.value += 1;
  }

  async function handleSaved(englishName: string): Promise<void> {
    const nextSlug = getWorkshopSlug(englishName);

    if (nextSlug === slug.value) {
      await reload();

      return;
    }

    await navigateTo(getWorkshopEditRoute(SPELLS_WORKSHOP_KEY, nextSlug), {
      replace: true,
    });
  }
</script>

<template>
  <SectionLayout :title="SPELL_EDITOR_TEXT.editTitle">
    <WorkshopAccessGate>
      <!-- Редактор разбирает разметку средствами браузера -->
      <ClientOnly>
        <WorkshopEntryState
          :is-loading="isLoading"
          :is-not-found="isNotFound"
          :is-error="isError"
          @retry="reload"
        >
          <div
            v-if="entry"
            class="flex max-w-5xl flex-col gap-8"
          >
            <SpellEditor
              :key="version"
              :spell="entry"
              @saved="handleSaved"
            />

            <WorkshopRevisions
              :key="version"
              :section-key="SPELLS_WORKSHOP_KEY"
              :entry-id="entry.id"
              @restored="reload"
            />
          </div>
        </WorkshopEntryState>
      </ClientOnly>
    </WorkshopAccessGate>
  </SectionLayout>
</template>
