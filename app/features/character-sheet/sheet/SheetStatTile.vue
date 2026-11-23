<script setup lang="ts">
  /**
   * Плитка показателя листа: подпись, крупное значение и подсказка. По клику
   * — бросок или правка, если плитка интерактивная.
   */
  const {
    label,
    value,
    hint = '',
    icon = '',
    isInteractive = false,
  } = defineProps<{
    label: string;
    value: string | number;
    hint?: string;
    icon?: string;
    isInteractive?: boolean;
  }>();

  const emit = defineEmits<{
    activate: [];
  }>();

  const tileClass = computed(() =>
    isInteractive
      ? 'cursor-pointer hover:border-primary/60 focus-visible:border-primary'
      : 'cursor-default',
  );

  function activate(): void {
    if (isInteractive) {
      emit('activate');
    }
  }
</script>

<template>
  <button
    type="button"
    class="flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl border border-default bg-elevated/40 px-2 py-2 text-center transition-colors outline-none"
    :class="tileClass"
    :tabindex="isInteractive ? 0 : -1"
    @click.left.exact.prevent="activate"
  >
    <span
      class="flex items-center gap-1 text-xs tracking-wide text-muted uppercase"
    >
      <UIcon
        v-if="icon"
        :name="icon"
        class="size-3.5"
      />

      {{ label }}
    </span>

    <span class="text-2xl leading-tight font-semibold text-highlighted">
      {{ value }}
    </span>

    <span
      v-if="hint"
      class="truncate text-xs text-muted"
    >
      {{ hint }}
    </span>
  </button>
</template>
