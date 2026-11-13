<script setup lang="ts">
  import { DM_SCREEN_ICON, DM_SCREEN_TEXT } from '../model';

  /** Подтверждение очистки ширмы: окна и заметки пропадают безвозвратно. */
  const emit = defineEmits<{
    confirm: [];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  function close(): void {
    isOpen.value = false;
  }

  function confirm(): void {
    emit('confirm');
    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="DM_SCREEN_TEXT.clearTitle"
    :description="DM_SCREEN_TEXT.clearDescription"
    :ui="{ content: 'max-w-sm', footer: 'justify-end' }"
  >
    <template #footer>
      <UButton
        :label="DM_SCREEN_TEXT.cancel"
        color="neutral"
        variant="ghost"
        @click.left.exact.prevent="close"
      />

      <UButton
        :label="DM_SCREEN_TEXT.clear"
        :icon="DM_SCREEN_ICON.delete"
        color="error"
        @click.left.exact.prevent="confirm"
      />
    </template>
  </UModal>
</template>
