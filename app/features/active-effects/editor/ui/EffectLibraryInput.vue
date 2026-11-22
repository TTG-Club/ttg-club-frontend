<script setup lang="ts">
  import { EFFECT_LIBRARY_INPUT_LABELS } from '../../model';

  /**
   * Текстовое поле со вставкой готового значения из библиотеки. Перенос поля
   * `InputWithLibrary` нового сайта (`~ui/input`): на старом сайте его нет.
   */
  interface LibraryOption {
    label: string;
    value: string;
  }

  const {
    options,
    placeholder = '',
    pickerPlaceholder = EFFECT_LIBRARY_INPUT_LABELS.picker,
  } = defineProps<{
    /** Готовые значения библиотеки. */
    options: Array<LibraryOption>;
    /** Подсказка в пустом поле. */
    placeholder?: string;
    /** Подпись выбора из библиотеки. */
    pickerPlaceholder?: string;
  }>();

  const model = defineModel<string>({ default: '' });

  // Селект-выбор подставляет значение в поле и сбрасывается, чтобы оставаться
  // «вставкой из библиотеки», а не вторым источником истины.
  const pickerValue = ref<string | undefined>(undefined);

  /**
   * Подставляет выбранное значение в поле и сбрасывает выбор.
   *
   * @param value выбранное значение библиотеки.
   */
  function applyPicked(value: string | undefined): void {
    if (typeof value === 'string') {
      model.value = value;
    }

    nextTick(() => {
      pickerValue.value = undefined;
    });
  }
</script>

<template>
  <div class="flex w-full gap-1">
    <UInput
      v-model="model"
      :placeholder="placeholder"
      class="flex-1 font-mono text-xs"
    />

    <USelectMenu
      v-model="pickerValue"
      :items="options"
      label-key="label"
      value-key="value"
      :search-input="{
        placeholder: EFFECT_LIBRARY_INPUT_LABELS.search,
        icon: 'tabler:search',
      }"
      icon="tabler:books"
      :placeholder="pickerPlaceholder"
      :aria-label="pickerPlaceholder"
      class="w-10 shrink-0"
      :ui="{
        base: 'px-2 justify-center',
        content: 'min-w-96 max-w-[32rem]',
        item: 'whitespace-normal',
      }"
      @update:model-value="applyPicked"
    />
  </div>
</template>
