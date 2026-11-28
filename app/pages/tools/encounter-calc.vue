<script setup lang="ts">
  import { EncounterCalcTool } from '~tools/encounter-calc';
  import {
    ENCOUNTER_CALC_DESCRIPTION,
    ENCOUNTER_CALC_TITLE,
  } from '~tools/encounter-calc/model';

  definePageMeta({ layout: 'section' });

  useSeoMeta({
    title: ENCOUNTER_CALC_TITLE,
    description: ENCOUNTER_CALC_DESCRIPTION,
  });
</script>

<template>
  <ClientOnly>
    <EncounterCalcTool />

    <template #fallback>
      <div
        class="mx-auto flex w-full max-w-(--max-content) flex-col gap-6 px-4 pt-4 md:pt-6"
      >
        <USkeleton class="h-8 w-1/3" />

        <USkeleton class="h-40 w-full rounded-xl" />

        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <USkeleton class="h-64 w-full rounded-xl" />

          <USkeleton class="h-64 w-full rounded-xl" />
        </div>
      </div>
    </template>
  </ClientOnly>
</template>
