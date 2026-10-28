<script setup lang="ts">
  import { MagicItemEntry } from '~inventory/magic-items';

  // Адрес записи как в старом SPA: рядом с `/items/:slug`
  definePageMeta({
    path: '/items/magic/:slug',
    alias: ['/tools/items/magic/:slug'],
  });
</script>

<template>
  <MagicItemEntry />
</template>
