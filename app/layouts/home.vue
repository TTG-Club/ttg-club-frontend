<script setup lang="ts">
  import { DiceHistory } from '~dice-roller/history';
  import { SidebarPanel } from '~infrastructure/sidebar/panel';
</script>

<template>
  <div class="min-h-dvh pb-(--navbar-height) md:pb-0 md:pl-(--navbar-width)">
    <!--
      Макет главной отличается от `default` одним: он не обрезает контент по
      ширине и не даёт полей. Так шапка-герой растягивается во всю ширину, а
      колонку блоков ниже задаёт сама страница.
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
