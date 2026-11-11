<script setup lang="ts">
  import { useScreenWindows } from '../composables';
  import { SCREEN_WINDOW_ICON, SCREEN_WINDOW_TEXT } from '../model';
  import ScreenWindow from './ScreenWindow.vue';

  /**
   * Окна ширмы поверх всего сайта и плашки свёрнутых окон внизу экрана.
   *
   * Слой окон — в конце `body` и без `z-index`: меню, подсказки и дроверы
   * Nuxt UI выносятся туда же позже и поэтому ложатся поверх окон. Боковая
   * панель и история бросков выше окон.
   */
  const { isAvailable, visibleWindows, minimizedWindows, restore, close } =
    useScreenWindows();
</script>

<template>
  <Teleport
    v-if="isAvailable"
    to="body"
  >
    <div class="pointer-events-none fixed inset-0 isolate">
      <ScreenWindow
        v-for="screenWindow in visibleWindows"
        :key="screenWindow.id"
        :screen-window="screenWindow"
      />
    </div>

    <div
      v-if="minimizedWindows.length"
      role="toolbar"
      :aria-label="SCREEN_WINDOW_TEXT.dock"
      class="fixed bottom-6 left-[calc(var(--navbar-width)+1rem)] flex max-w-[calc(100vw-var(--navbar-width)-6rem)] flex-wrap gap-2"
    >
      <div
        v-for="screenWindow in minimizedWindows"
        :key="screenWindow.id"
        class="flex items-center rounded-md border border-default bg-elevated shadow-lg"
      >
        <UButton
          :icon="SCREEN_WINDOW_ICON.window"
          :label="screenWindow.title"
          :aria-label="`${SCREEN_WINDOW_TEXT.restore}: ${screenWindow.title}`"
          color="neutral"
          variant="ghost"
          size="sm"
          class="max-w-56"
          :ui="{ label: 'truncate' }"
          @click.left.exact.prevent="restore(screenWindow.id)"
        />

        <UButton
          :icon="SCREEN_WINDOW_ICON.close"
          :aria-label="`${SCREEN_WINDOW_TEXT.close}: ${screenWindow.title}`"
          color="neutral"
          variant="ghost"
          size="xs"
          @click.left.exact.prevent="close(screenWindow.id)"
        />
      </div>
    </div>
  </Teleport>
</template>
