<script setup lang="ts">
  import { BRUSH_COLORS } from '../../model';

  /** Выбор цвета кисти. */
  const { disabled = false } = defineProps<{
    disabled?: boolean;
  }>();

  const color = defineModel<string>({ required: true });

  /**
   * Оформление кружка цвета: выбранный обведён.
   * @param value - цвет
   */
  function getSwatchStyle(value: string): Record<string, string> {
    if (color.value !== value) {
      return { backgroundColor: value };
    }

    return {
      backgroundColor: value,
      boxShadow: `0 0 0 2px var(--ui-bg), 0 0 0 4px ${value}`,
    };
  }

  /**
   * Выбирает цвет.
   * @param value - цвет
   */
  function select(value: string): void {
    color.value = value;
  }
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <button
      v-for="brush in BRUSH_COLORS"
      :key="brush.value"
      :style="getSwatchStyle(brush.value)"
      :title="brush.name"
      :aria-label="brush.name"
      :aria-pressed="color === brush.value"
      :disabled="disabled"
      type="button"
      class="size-6 cursor-pointer rounded-full transition-transform hover:enabled:scale-110 disabled:cursor-not-allowed"
      @click.left.exact.prevent="select(brush.value)"
    />
  </div>
</template>
