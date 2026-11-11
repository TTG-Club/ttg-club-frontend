<script setup lang="ts">
  import { DiceHistory } from '~dice-roller/history';
  import { SidebarPanel } from '~infrastructure/sidebar/panel';
</script>

<template>
  <div class="min-h-dvh pb-(--navbar-height) md:pb-0 md:pl-(--navbar-width)">
    <SidebarPanel />

    <!--
      Изоляция держит слои страницы (липкие панели и т. п.) внутри main:
      иначе они ложились бы поверх окон ширмы.
    -->
    <main class="isolate mx-auto w-full max-w-(--max-content) px-4 py-6">
      <slot />
    </main>

    <ClientOnly>
      <DiceHistory />
    </ClientOnly>
  </div>
</template>
