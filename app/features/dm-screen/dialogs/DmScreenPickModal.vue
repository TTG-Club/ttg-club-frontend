<script setup lang="ts">
  import type { DmScreenSummary } from '../model';

  import { DM_SCREEN_ICON, DM_SCREEN_TEXT } from '../model';

  /**
   * Выбор ширмы для «В ширму», когда ширм несколько. Открывается через
   * `useOverlay`: закрытие отдаёт выбранную ширму или ничего.
   */
  const { screens } = defineProps<{
    /** Ширмы пользователя: недавно изменённые — первыми. */
    screens: ReadonlyArray<DmScreenSummary>;
  }>();

  const emit = defineEmits<{
    close: [id?: string];
  }>();

  // Закрытие крестиком или Esc `useOverlay` сам отдаёт как «ничего не
  // выбрано»: `open` и его событие доходят до модалки как атрибуты

  /**
   * Выбирает ширму.
   * @param id - идентификатор ширмы
   */
  function pick(id: string): void {
    emit('close', id);
  }
</script>

<template>
  <UModal
    :title="DM_SCREEN_TEXT.pickTitle"
    :description="DM_SCREEN_TEXT.pickDescription"
    :ui="{ content: 'max-w-sm' }"
  >
    <template #body>
      <ul class="flex flex-col gap-1">
        <li
          v-for="screen in screens"
          :key="screen.id"
        >
          <UButton
            :icon="DM_SCREEN_ICON.screen"
            :label="screen.name"
            color="neutral"
            variant="ghost"
            block
            class="justify-start"
            @click.left.exact.prevent="pick(screen.id)"
          />
        </li>
      </ul>
    </template>
  </UModal>
</template>
