<script setup lang="ts">
  import { FeatEntry } from '~character/feats';

  // Записи по старому адресу черт `/traits/<черта>`, как в старом SPA
  definePageMeta({
    alias: ['/traits/:slug'],
  });
</script>

<template>
  <FeatEntry />
</template>
