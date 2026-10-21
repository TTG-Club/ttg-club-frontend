<script setup lang="ts">
  import { SiteHeader } from '~infrastructure/site-header';
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <SiteHeader />

    <main class="mx-auto w-full max-w-(--max-content) flex-1 px-4 py-6">
      <slot />
    </main>
  </div>
</template>
