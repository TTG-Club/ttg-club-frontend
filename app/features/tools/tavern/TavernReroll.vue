<script setup lang="ts">
  import { TOOLS_ICON } from '../model';

  /** Кнопка перегенерации части таверны: иконка с подсказкой. */
  const { label, isPending = false } = defineProps<{
    label: string;
    isPending?: boolean;
  }>();

  const emit = defineEmits<{
    reroll: [];
  }>();

  function reroll(): void {
    emit('reroll');
  }
</script>

<template>
  <UTooltip :text="label">
    <UButton
      :icon="TOOLS_ICON.reroll"
      :aria-label="label"
      :loading="isPending"
      color="neutral"
      variant="ghost"
      class="shrink-0"
      @click.left.exact.prevent="reroll"
    />
  </UTooltip>
</template>
