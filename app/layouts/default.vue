<script setup lang="ts">
  import { DiceHistory } from '~dice-roller/history';
  import { AppFooter } from '~infrastructure/footer';
  import { SidebarPanel } from '~infrastructure/sidebar/panel';
</script>

<template>
  <div
    class="flex min-h-dvh flex-col pb-(--navbar-height) md:pb-0 md:pl-(--navbar-width)"
  >
    <SidebarPanel />

    <!--
      Изоляция держит слои страницы (липкие панели и т. п.) внутри main:
      иначе они ложились бы поверх окон ширмы.
    -->
    <main class="isolate mx-auto w-full max-w-(--max-content) px-4 pt-6 pb-8">
      <slot />
    </main>

    <AppFooter />

    <ClientOnly>
      <DiceHistory />
    </ClientOnly>
  </div>
</template>
