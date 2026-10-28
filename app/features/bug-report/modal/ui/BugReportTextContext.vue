<script setup lang="ts">
  import type { TextSelection } from '../../model';

  import { BUG_REPORT_ICON, BUG_REPORT_TEXT } from '../../model';

  /** Выделенный текст с окружением; выделенное подчёркнуто. */
  const { selection } = defineProps<{
    selection: TextSelection;
  }>();

  const emit = defineEmits<{
    clear: [];
  }>();

  function clear(): void {
    emit('clear');
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-1.5 text-xs text-muted">
      <UIcon
        :name="BUG_REPORT_ICON.selection"
        class="size-4 shrink-0"
      />

      <span class="font-medium">{{ BUG_REPORT_TEXT.selection }}</span>

      <UButton
        :icon="BUG_REPORT_ICON.close"
        :aria-label="BUG_REPORT_TEXT.removeSelection"
        color="neutral"
        variant="ghost"
        size="xs"
        class="ml-auto"
        @click.left.exact.prevent="clear"
      />
    </div>

    <p
      class="max-h-30 overflow-y-auto rounded-lg border border-default bg-elevated p-3 text-xs leading-5 break-words whitespace-pre-wrap"
    >
      <span
        v-if="selection.before"
        class="text-muted"
        >…{{ selection.before }}</span
      >

      <span
        class="font-semibold text-highlighted underline decoration-error underline-offset-3"
        >{{ selection.selected }}</span
      >

      <span
        v-if="selection.after"
        class="text-muted"
        >{{ selection.after }}…</span
      >
    </p>
  </div>
</template>
