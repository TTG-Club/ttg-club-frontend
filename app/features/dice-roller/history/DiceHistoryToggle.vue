<script setup lang="ts">
  import { useDiceHistory } from '../composables';
  import { ROLL_HISTORY_ICON, ROLL_HISTORY_TEXT } from '../model';

  /** Кнопка, которая открывает и закрывает историю бросков. */
  const { isOpen, toggle } = useDiceHistory();

  const icon = computed(() =>
    isOpen.value ? ROLL_HISTORY_ICON.close : ROLL_HISTORY_ICON.open,
  );
</script>

<template>
  <UButton
    :icon="icon"
    :aria-label="ROLL_HISTORY_TEXT.title"
    :aria-pressed="isOpen"
    color="neutral"
    variant="ghost"
    size="xl"
    @click.left.exact.prevent="toggle"
  />
</template>
