<script setup lang="ts">
  import { SidebarPanel } from '~infrastructure/sidebar/panel';
</script>

<template>
  <div class="min-h-dvh pb-(--navbar-height) md:pb-0 md:pl-(--navbar-width)">
    <SidebarPanel />

    <main class="mx-auto w-full max-w-(--max-content) px-4 py-6">
      <slot />
    </main>
  </div>
</template>
