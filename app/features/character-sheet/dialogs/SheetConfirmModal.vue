<script setup lang="ts">
  import { SHEET_ICON, SHEET_TEXT } from '../model';

  /** Подтверждение необратимого действия, например удаления листа. */
  const { title, description } = defineProps<{
    title: string;
    description: string;
  }>();

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
    :title="title"
    :description="description"
    :ui="{ content: 'max-w-sm', footer: 'justify-end' }"
  >
    <template #footer>
      <UButton
        :label="SHEET_TEXT.cancel"
        color="neutral"
        variant="ghost"
        @click.left.exact.prevent="close"
      />

      <UButton
        :label="SHEET_TEXT.confirm"
        :icon="SHEET_ICON.remove"
        color="error"
        @click.left.exact.prevent="confirm"
      />
    </template>
  </UModal>
</template>
