<script setup lang="ts">
  import type { BrushColor } from '@/features/bug-report/model';
  import { BRUSH_COLORS } from '@/features/bug-report/model';

  const props = defineProps<{
    modelValue: string;
    disabled?: boolean;
    vertical?: boolean;
  }>();

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
  }>();

  function selectColor(brushColor: BrushColor) {
    emit('update:modelValue', brushColor.value);
  }

  function isSelected(brushColor: BrushColor): boolean {
    return props.modelValue === brushColor.value;
  }
</script>

<template>
  <div :class="['color-picker', { 'is-vertical': vertical }]">
    <button
      v-for="brushColor in BRUSH_COLORS"
      :key="brushColor.name"
      :class="['color-picker__btn', { 'is-selected': isSelected(brushColor) }]"
      :style="{
        backgroundColor: brushColor.value,
        boxShadow: isSelected(brushColor)
          ? `0 0 0 2px var(--bg-secondary), 0 0 0 4px ${brushColor.value}`
          : undefined,
      }"
      :title="brushColor.name"
      :disabled="disabled"
      type="button"
      @click.left.exact.prevent="selectColor(brushColor)"
    />
  </div>
</template>

<style lang="scss" scoped>
  .color-picker {
    display: flex;
    gap: 8px;
    align-items: center;

    &.is-vertical {
      flex-direction: column;
    }
  }

  .color-picker__btn {
    cursor: pointer;

    width: 24px;
    height: 24px;
    padding: 0;

    border: 2px solid transparent;
    border-radius: 50%;

    transition: all 0.15s ease-in-out;

    &:hover:not(:disabled) {
      transform: scale(1.15);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    &.is-selected {
      border-color: var(--text-color);
    }
  }
</style>
