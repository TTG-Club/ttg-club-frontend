<script setup lang="ts">
  import { useBookSources } from '../composables';
  import { WORKSHOP_TEXT } from '../model';

  /**
   * Книга-источник записи. Пустой выбор: новая запись попадёт в самодельный
   * контент, а у существующей источник не изменится.
   */
  const model = defineModel<string | undefined>({ required: true });

  const { options, isLoading } = useBookSources();
</script>

<template>
  <UFormField
    :label="WORKSHOP_TEXT.source"
    :help="WORKSHOP_TEXT.sourceHelp"
    name="source"
  >
    <USelectMenu
      v-model="model"
      :items="options"
      :loading="isLoading"
      :placeholder="WORKSHOP_TEXT.sourcePlaceholder"
      value-key="value"
      class="w-full"
      clear
    />
  </UFormField>
</template>
