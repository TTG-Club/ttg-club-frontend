<script setup lang="ts">
  import type { ToolResultGridView } from '../model';

  import { TOOL_RESULT_GRID_CLASS } from '../model';

  /**
   * Сетка карточек результатов генератора. Колонки считаются по ширине
   * области результатов, а не экрана, поэтому боковая панель настроек
   * не ломает раскладку.
   */
  const { view = 'text' } = defineProps<{
    view?: ToolResultGridView;
  }>();

  defineSlots<{
    /** Карточки результатов. */
    default: () => unknown;
  }>();

  const gridClass = computed(() => TOOL_RESULT_GRID_CLASS[view]);
</script>

<template>
  <div class="@container">
    <div :class="gridClass">
      <slot />
    </div>
  </div>
</template>
