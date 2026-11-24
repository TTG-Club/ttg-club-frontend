<script setup lang="ts">
  /**
   * Поле текста в разметке для окон листа: редактор мастерской с базовым
   * набором кнопок. Редактор тяжёлый, поэтому грузится, только когда окно
   * открыли.
   */
  const MarkupEditor = defineAsyncComponent(() =>
    import('~workshop/markup-editor').then((module) => module.MarkupEditor),
  );

  const { placeholder = '' } = defineProps<{
    placeholder?: string;
  }>();

  const model = defineModel<Array<string>>({ default: () => [] });
</script>

<template>
  <MarkupEditor
    v-model="model"
    preset="basic"
    :placeholder="placeholder"
  />
</template>
