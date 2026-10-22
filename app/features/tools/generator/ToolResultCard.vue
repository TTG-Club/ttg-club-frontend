<script setup lang="ts">
  import { ContentRender } from '~content/render';

  /**
   * Результат генератора: подписи сверху и описание из базы с кубиками и
   * подсказками.
   */
  const { html } = defineProps<{
    html: string;
  }>();

  defineSlots<{
    /** Подписи над описанием: вид, длительность, таблица. */
    header?: () => unknown;
    /** Метка справа, например книга. */
    trailing?: () => unknown;
  }>();
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

    <slot name="trailing" />
  </article>
</template>
