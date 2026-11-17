<script setup lang="ts">
  import { useDmScreen } from '../composables';
  import {
    DM_SCREEN_ICON,
    DM_SCREEN_TEXT,
    getDmScreenWindowIcon,
  } from '../model';

  /**
   * Плашки свёрнутых окон у левого нижнего угла холста: клик по плашке
   * разворачивает окно поверх остальных и подводит к нему обзор, если окно
   * стоит за краем холста; крестик убирает его с ширмы.
   */
  const { minimizedWindows, restore, reveal, close } = useDmScreen();

  const chips = computed(() =>
    minimizedWindows.value.map((screenWindow) => ({
      id: screenWindow.id,
      title: screenWindow.title,
      icon: getDmScreenWindowIcon(screenWindow.path),
      restoreLabel: `${DM_SCREEN_TEXT.restore}: ${screenWindow.title}`,
      closeLabel: `${DM_SCREEN_TEXT.close}: ${screenWindow.title}`,
    })),
  );

  /**
   * Разворачивает окно и показывает его.
   * @param id - окно
   */
  function restoreWindow(id: string): void {
    restore(id);
    reveal(id);
  }
</script>

<template>
  <div
    v-if="chips.length"
    role="toolbar"
    :aria-label="DM_SCREEN_TEXT.dock"
    class="absolute bottom-2 left-2 flex max-w-[calc(100%-6rem)] flex-wrap gap-1.5"
  >
    <div
      v-for="chip in chips"
      :key="chip.id"
      class="flex items-center rounded-md border border-default bg-elevated shadow-lg"
    >
      <UButton
        :icon="chip.icon"
        :label="chip.title"
        :aria-label="chip.restoreLabel"
        color="neutral"
        variant="ghost"
        size="sm"
        class="max-w-56"
        :ui="{ label: 'truncate', leadingIcon: 'text-primary' }"
        @click.left.exact.prevent="restoreWindow(chip.id)"
      />

      <UButton
        :icon="DM_SCREEN_ICON.close"
        :aria-label="chip.closeLabel"
        color="neutral"
        variant="ghost"
        size="xs"
        @click.left.exact.prevent="close(chip.id)"
      />
    </div>
  </div>
</template>
