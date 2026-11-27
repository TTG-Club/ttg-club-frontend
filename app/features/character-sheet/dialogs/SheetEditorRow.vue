<script setup lang="ts">
  import type { SheetEditor } from '../model';

  import { SHEET_EDIT_ICON, SHEET_EDITORS_TEXT } from '../model';

  /**
   * Строка запроса на редактирование или выданного права — у владельца листа:
   * в баннере запросов и в окне «Поделиться». Решение принимает хозяин
   * строки, она лишь сообщает, какую кнопку нажали.
   */
  const {
    editor,
    canApprove = true,
    disabled = false,
  } = defineProps<{
    editor: SheetEditor;

    /** Место для нового редактора есть — запрос можно разрешить. */
    canApprove?: boolean;

    /** Заблокировать кнопки, пока идёт решение по другой строке. */
    disabled?: boolean;
  }>();

  const emit = defineEmits<{
    approve: [editorId: string];
    remove: [editorId: string];
  }>();

  const isPendingRequest = computed(() => editor.status === 'PENDING');

  // Причина недоступности — в подсказке: серая кнопка без неё выглядит поломкой
  const approveTooltip = computed(() =>
    canApprove ? SHEET_EDITORS_TEXT.approve : SHEET_EDITORS_TEXT.limitReached,
  );

  const isApproveDisabled = computed(() => disabled || !canApprove);

  /** Разрешить правки по запросу. */
  function handleApprove(): void {
    emit('approve', editor.id);
  }

  /** Отклонить запрос или отозвать выданное право. */
  function handleRemove(): void {
    emit('remove', editor.id);
  }
</script>

<template>
  <div class="flex items-center gap-3">
    <UAvatar
      :alt="editor.displayName"
      size="md"
      :ui="{ fallback: 'uppercase' }"
    />

    <!-- Состояние строки видно по кнопкам: «Разрешить/Отклонить» — запрос,
      «Отозвать» — редактор -->
    <span
      class="min-w-0 flex-auto truncate text-sm font-medium text-highlighted"
    >
      {{ editor.displayName }}
    </span>

    <div class="flex shrink-0 items-center gap-1">
      <template v-if="isPendingRequest">
        <UTooltip :text="approveTooltip">
          <UButton
            :label="SHEET_EDITORS_TEXT.approve"
            :icon="SHEET_EDIT_ICON.approve"
            color="primary"
            variant="soft"
            size="sm"
            :disabled="isApproveDisabled"
            @click.left.exact.prevent="handleApprove"
          />
        </UTooltip>

        <UButton
          :label="SHEET_EDITORS_TEXT.decline"
          :icon="SHEET_EDIT_ICON.remove"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled
          @click.left.exact.prevent="handleRemove"
        />
      </template>

      <UButton
        v-else
        :label="SHEET_EDITORS_TEXT.revoke"
        :icon="SHEET_EDIT_ICON.remove"
        color="error"
        variant="ghost"
        size="sm"
        :disabled
        @click.left.exact.prevent="handleRemove"
      />
    </div>
  </div>
</template>
