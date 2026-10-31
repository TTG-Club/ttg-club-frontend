<script setup lang="ts">
  import { TOOLS_ICON, TOOLS_TEXT } from '../model';

  /** Кнопка, которая убирает карточку результата из списка. */
  const emit = defineEmits<{
    close: [];
  }>();

  function close(): void {
    emit('close');
  }
</script>

<template>
  <UTooltip :text="TOOLS_TEXT.close">
    <UButton
      :icon="TOOLS_ICON.close"
      :aria-label="TOOLS_TEXT.close"
      color="neutral"
      variant="ghost"
      class="shrink-0"
      @click.left.exact.prevent="close"
    />
  </UTooltip>
</template>
