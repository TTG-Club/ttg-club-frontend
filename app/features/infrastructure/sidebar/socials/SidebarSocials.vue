<script setup lang="ts">
  import { SIDEBAR_SOCIAL_LINKS } from '../menu/model';
</script>

<template>
  <div class="hidden flex-col items-center gap-2 pb-4 md:flex">
    <UButton
      v-for="link in SIDEBAR_SOCIAL_LINKS"
      :key="link.url"
      :to="link.url"
      :icon="link.icon"
      :aria-label="link.label"
      target="_blank"
      color="neutral"
      variant="ghost"
      size="xl"
      class="opacity-70 hover:opacity-100"
    />
  </div>
</template>
