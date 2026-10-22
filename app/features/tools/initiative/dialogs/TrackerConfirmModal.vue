<script setup lang="ts">
  import { INITIATIVE_TEXT } from '../model';

  /** Подтверждение необратимого действия: удаления или завершения боя. */
  const {
    title,
    description,
    confirmLabel,
    confirmIcon,
    color = 'error',
  } = defineProps<{
    title: string;
    description: string;
    confirmLabel: string;
    confirmIcon: string;
    color?: 'error' | 'warning';
  }>();

  const emit = defineEmits<{
    confirm: [];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  function close(): void {
    isOpen.value = false;
  }

  function confirm(): void {
    isOpen.value = false;
    emit('confirm');
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
        :label="INITIATIVE_TEXT.cancel"
        color="neutral"
        variant="ghost"
        @click.left.exact.prevent="close"
      />

      <UButton
        :label="confirmLabel"
        :icon="confirmIcon"
        :color="color"
        @click.left.exact.prevent="confirm"
      />
    </template>
  </UModal>
</template>
