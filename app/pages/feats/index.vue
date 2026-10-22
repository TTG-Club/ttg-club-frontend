<script setup lang="ts">
  import { FeatsSection } from '~character/feats';

  // Старый адрес черт `/traits` и его записи ведут сюда же, как в старом SPA
  definePageMeta({
    alias: ['/traits'],
    layout: 'section',
  });
</script>

<template>
  <FeatsSection />
</template>
