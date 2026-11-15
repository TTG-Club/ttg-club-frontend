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
