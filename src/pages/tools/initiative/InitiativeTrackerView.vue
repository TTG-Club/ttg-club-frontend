<script setup lang="ts">
  import { useTitle } from '@vueuse/core';

  import { INITIATIVE_TOOL_TITLE } from '@/features/initiative/model';
  import { InitiativeTrackerWorkspace } from '@/features/initiative/workspace';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  const route = useRoute();
  const id = computed(() => String(route.params.id));

  useTitle(`${INITIATIVE_TOOL_TITLE} — D&D 5`);
</script>

<template>
  <content-layout :title="INITIATIVE_TOOL_TITLE">
    <initiative-tracker-workspace :id="id" />
  </content-layout>
</template>
