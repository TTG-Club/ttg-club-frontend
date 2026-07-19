<script setup lang="ts">
  import { useTitle } from '@vueuse/core';

  import { InitiativeTrackerList } from '@/features/initiative/list';
  import { INITIATIVE_TOOL_TITLE } from '@/features/initiative/model';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  useTitle('Трекер инициативы [Initiative Tracker] — D&D 5');
</script>

<template>
  <content-layout :title="INITIATIVE_TOOL_TITLE">
    <initiative-tracker-list />
  </content-layout>
</template>
