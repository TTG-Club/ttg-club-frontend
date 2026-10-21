<script setup lang="ts">
  import { MagicItemsSection } from '~inventory/magic-items';

  // Адрес как в старом SPA: рядом с `/items/:slug`, но со своим списком
  definePageMeta({
    path: '/items/magic',
    alias: ['/tools/items/magic'],
  });
</script>

<template>
  <MagicItemsSection />
</template>
