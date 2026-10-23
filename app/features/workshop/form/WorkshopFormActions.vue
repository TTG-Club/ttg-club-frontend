<script setup lang="ts">
  import { WORKSHOP_ICON, WORKSHOP_TEXT } from '../model';

  /** Отправка формы редактора и отмена. */
  const { isEditing, isSaving, cancelTo } = defineProps<{
    /** Правка существующей записи, а не создание. */
    isEditing: boolean;
    isSaving: boolean;
    /** Куда ведёт отмена. */
    cancelTo: string;
  }>();

  const submitLabel = computed(() =>
    isEditing ? WORKSHOP_TEXT.save : WORKSHOP_TEXT.createSubmit,
  );
</script>

<template>
  <div class="flex flex-wrap items-center gap-3 pt-2">
    <UButton
      :label="submitLabel"
      :icon="WORKSHOP_ICON.save"
      :loading="isSaving"
      type="submit"
    />

    <UButton
      :label="WORKSHOP_TEXT.cancel"
      :to="cancelTo"
      color="neutral"
      variant="ghost"
    />
  </div>
</template>
