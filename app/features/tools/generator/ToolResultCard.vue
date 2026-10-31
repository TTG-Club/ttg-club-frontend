<script setup lang="ts">
  import { ContentRender } from '~content/render';

  import ToolCloseButton from './ToolCloseButton.vue';

  /**
   * Результат генератора: подписи сверху и описание из базы с кубиками и
   * подсказками. Крестик справа убирает карточку из списка.
   */
  const { html } = defineProps<{
    html: string;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  defineSlots<{
    /** Подписи над описанием: вид, длительность, таблица. */
    header?: () => unknown;
    /** Метка справа, например книга. */
    trailing?: () => unknown;
  }>();

  function close(): void {
    emit('close');
  }
</script>

<template>
  <article
    class="flex items-start gap-4 rounded-xl border border-default bg-elevated/50 p-4"
  >
    <div class="flex min-w-0 flex-auto flex-col gap-3">
      <div
        v-if="$slots.header"
        class="flex flex-col gap-1 text-sm"
      >
        <slot name="header" />
      </div>

      <ContentRender :html="html" />
    </div>

    <div class="flex shrink-0 items-start gap-2">
      <slot name="trailing" />

      <ToolCloseButton @close="close" />
    </div>
  </article>
</template>
