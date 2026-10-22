<script setup lang="ts">
  import { DiceHistory } from '~dice-roller/history';
  import { SidebarPanel } from '~infrastructure/sidebar/panel';
</script>

<template>
  <div class="min-h-dvh pb-(--navbar-height) md:pb-0 md:pl-(--navbar-width)">
    <!--
      Макет разделов: ширину и колонки задаёт сам раздел. В широком режиме
      список и карточка занимают весь экран, в обычном раздел центрируется.
    -->
    <SidebarPanel />

    <main class="w-full">
      <slot />
    </main>

    <ClientOnly>
      <DiceHistory />
    </ClientOnly>
  </div>
</template>
