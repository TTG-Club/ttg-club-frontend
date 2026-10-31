<script setup lang="ts">
  import { SectionLayout } from '~section/layout';

  import { TOOLS_ICON, TOOLS_TEXT } from '../model';

  /**
   * Страница генератора, как разделы на new.ttg.club: слева заголовок и
   * настройки с кнопками, справа результаты, новые сверху.
   */
  const {
    title,
    isPending = false,
    hasResults = false,
  } = defineProps<{
    title: string;
    isPending?: boolean;
    hasResults?: boolean;
  }>();

  const emit = defineEmits<{
    generate: [];
    clear: [];
  }>();

  defineSlots<{
    /** Поля настроек генератора. */
    form: () => unknown;
    /** Кнопки после «Сгенерировать» и «Очистить». */
    actions?: () => unknown;
    /** Результаты. */
    default: () => unknown;
  }>();

  function generate(): void {
    emit('generate');
  }

  function clear(): void {
    emit('clear');
  }
</script>

<template>
  <SectionLayout
    :title="title"
    is-full-width
  >
    <template #controls>
      <form
        class="flex flex-col gap-4"
        @submit.prevent="generate"
      >
        <slot name="form" />

        <div class="flex flex-wrap gap-2">
          <UButton
            type="submit"
            :icon="TOOLS_ICON.generate"
            :label="TOOLS_TEXT.generate"
            :loading="isPending"
          />

          <UButton
            :icon="TOOLS_ICON.clear"
            :label="TOOLS_TEXT.clear"
            :disabled="!hasResults"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="clear"
          />

          <slot name="actions" />
        </div>
      </form>
    </template>

    <div
      v-if="hasResults"
      class="flex flex-col gap-3"
    >
      <slot />
    </div>

    <UEmpty
      v-else
      :icon="TOOLS_ICON.empty"
      :title="TOOLS_TEXT.empty"
      variant="naked"
      class="py-16"
    />
  </SectionLayout>
</template>
