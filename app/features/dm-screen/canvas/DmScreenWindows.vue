<script setup lang="ts">
  import { useDmScreen } from '../composables';
  import {
    DM_SCREEN_ICON,
    DM_SCREEN_TEXT,
    getDmScreenWindowIcon,
  } from '../model';
  import { DmScreenWindow } from '../window';

  /**
   * Окна ширмы и плашки свёрнутых окон, прижатые к левому нижнему углу.
   *
   * Слой окон без `z-index`: меню, подсказки и дроверы Nuxt UI выносятся в
   * конец `body` и поэтому ложатся поверх окон. Боковая панель и история
   * бросков выше окон.
   */
  const { visibleWindows, minimizedWindows, restore, close } = useDmScreen();
</script>

<template>
  <div class="pointer-events-none fixed inset-0 isolate">
    <DmScreenWindow
      v-for="screenWindow in visibleWindows"
      :key="screenWindow.id"
      :screen-window="screenWindow"
    />
  </div>

  <div
    v-if="minimizedWindows.length"
    role="toolbar"
    :aria-label="DM_SCREEN_TEXT.dock"
    class="fixed bottom-2 left-[calc(var(--navbar-width)+0.5rem)] flex max-w-[calc(100vw-var(--navbar-width)-5rem)] flex-wrap gap-1.5"
  >
    <div
      v-for="screenWindow in minimizedWindows"
      :key="screenWindow.id"
      class="flex items-center rounded-md border border-default bg-elevated shadow-lg"
    >
      <UButton
        :icon="getDmScreenWindowIcon(screenWindow.path)"
        :label="screenWindow.title"
        :aria-label="`${DM_SCREEN_TEXT.restore}: ${screenWindow.title}`"
        color="neutral"
        variant="ghost"
        size="sm"
        class="max-w-56"
        :ui="{ label: 'truncate', leadingIcon: 'text-primary' }"
        @click.left.exact.prevent="restore(screenWindow.id)"
      />

      <UButton
        :icon="DM_SCREEN_ICON.close"
        :aria-label="`${DM_SCREEN_TEXT.close}: ${screenWindow.title}`"
        color="neutral"
        variant="ghost"
        size="xs"
        @click.left.exact.prevent="close(screenWindow.id)"
      />
    </div>
  </div>
</template>
