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

    <!--
      Изоляция держит слои страницы (липкие панели и т. п.) внутри main:
      иначе они ложились бы поверх окон ширмы.
    -->
    <main class="isolate w-full">
      <slot />
    </main>

    <ClientOnly>
      <DiceHistory />
    </ClientOnly>
  </div>
</template>
