<script setup lang="ts">
  import { WORKSHOP_ICON, WORKSHOP_TEXT } from '../model';

  /**
   * Отправка формы редактора и отмена. Панель прилипает к низу экрана, пока
   * форма прокручивается, поэтому сохранить можно из любого места формы.
   * На телефоне она стоит над нижней панелью навигации.
   */
  const { isEditing, isSaving, cancelTo } = defineProps<{
    /** Правка существующей записи, а не создание. */
    isEditing: boolean;
    isSaving: boolean;
    /** Куда ведёт отмена. */
    cancelTo: string;
  }>();

  defineSlots<{
    /** Дополнительные кнопки между сохранением и отменой. */
    default?: () => unknown;
  }>();

  const submitLabel = computed(() =>
    isEditing ? WORKSHOP_TEXT.save : WORKSHOP_TEXT.createSubmit,
  );
</script>

<template>
  <div
    class="sticky bottom-(--navbar-height) z-20 col-span-full -mx-4 border-t border-default bg-default/90 px-4 py-3 backdrop-blur md:bottom-0"
  >
    <div class="flex flex-wrap items-center gap-3">
      <UButton
        :label="submitLabel"
        :icon="WORKSHOP_ICON.save"
        :loading="isSaving"
        type="submit"
      />

      <slot />

      <UButton
        :label="WORKSHOP_TEXT.cancel"
        :to="cancelTo"
        color="neutral"
        variant="ghost"
      />
    </div>
  </div>
</template>
