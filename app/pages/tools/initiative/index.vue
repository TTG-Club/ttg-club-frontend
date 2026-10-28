<script setup lang="ts">
  import { InitiativeTrackerList } from '~tools/initiative/list';

  definePageMeta({ layout: 'section' });
</script>

<template>
  <ClientOnly>
    <InitiativeTrackerList />
  </ClientOnly>
</template>
