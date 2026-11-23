<script setup lang="ts">
  import { MECHANICS_ICON, MECHANICS_TEXT } from '../model';

  /**
   * Строка списка механики: поля в сетке и кнопка удаления справа. Кнопка
   * лежит рядом с полями, а не над ними, чтобы строка оставалась плоской.
   */
  const emit = defineEmits<{
    remove: [];
  }>();

  defineSlots<{
    default?: () => unknown;
  }>();

  function remove(): void {
    emit('remove');
  }
</script>

<template>
  <div
    class="flex items-start gap-2 rounded-lg border border-default bg-elevated/20 p-2"
  >
    <div
      class="grid min-w-0 flex-1 grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <slot />
    </div>

    <UButton
      :aria-label="MECHANICS_TEXT.remove"
      :icon="MECHANICS_ICON.remove"
      color="error"
      variant="ghost"
      size="xs"
      class="shrink-0"
      @click.left.exact.prevent="remove"
    />
  </div>
</template>
