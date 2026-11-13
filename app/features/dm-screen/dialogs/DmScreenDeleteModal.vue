<script setup lang="ts">
  import { DM_SCREEN_ICON, DM_SCREEN_TEXT } from '../model';

  /** Подтверждение удаления ширмы: оно необратимо. */
  const { name } = defineProps<{
    /** Имя удаляемой ширмы. */
    name: string;
  }>();

  const emit = defineEmits<{
    confirm: [];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const title = computed(() => `${DM_SCREEN_TEXT.deleteTitle} «${name}»`);

  function close(): void {
    isOpen.value = false;
  }

  // Сначала событие: закрытие окна сбрасывает у родителя выбранную ширму
  function confirm(): void {
    emit('confirm');
    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :description="DM_SCREEN_TEXT.deleteDescription"
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
        :label="DM_SCREEN_TEXT.delete"
        :icon="DM_SCREEN_ICON.delete"
        color="error"
        @click.left.exact.prevent="confirm"
      />
    </template>
  </UModal>
</template>
