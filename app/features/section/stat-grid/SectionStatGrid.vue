<script setup lang="ts">
  /**
   * Таблица характеристик записи: ячейки по две-три в ряд с рамками между
   * ними, как `grid_stat_block` старого SPA.
   */
  defineSlots<{
    default: () => unknown;
  }>();
</script>

<template>
  <dl
    class="grid grid-cols-1 overflow-hidden rounded-lg border border-default sm:grid-cols-2 xl:grid-cols-3"
  >
    <slot />
  </dl>
</template>
