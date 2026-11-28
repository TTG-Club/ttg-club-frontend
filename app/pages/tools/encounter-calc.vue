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
      <div class="flex flex-col gap-4">
        <USkeleton class="h-12 w-full rounded-xl" />

        <USkeleton class="h-64 w-full rounded-xl" />
      </div>
    </template>
  </ClientOnly>
</template>
