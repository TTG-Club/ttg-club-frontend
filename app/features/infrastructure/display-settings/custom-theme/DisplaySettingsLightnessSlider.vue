<script setup lang="ts">
  import {
    CUSTOM_THEME_LIGHTNESS_TITLE,
    CUSTOM_THEME_PERCENT_RANGE,
  } from './constants';

  type SliderValue = number | Array<number> | undefined;

  /**
   * Число из значения ползунка. USlider отдаёт значение массивом даже с одним
   * бегунком, а настройки темы ждут число — иначе проверка сочтёт их
   * испорченными и сбросит тему.
   *
   * @param value - Значение ползунка
   * @returns Число или 0, если значения нет
   */
  function readSliderValue(value: SliderValue): number {
    return (Array.isArray(value) ? value[0] : value) ?? 0;
  }

  /** Ползунок яркости цвета своей темы с подписью и значением в процентах. */
  const model = defineModel<number>({ required: true });

  const sliderValue = computed({
    get: () => model.value,
    set: (value: SliderValue) => {
      model.value = readSliderValue(value);
    },
  });

  const valueLabel = computed(() => `${model.value}%`);
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex items-baseline justify-between gap-2 text-sm">
      <span class="font-medium text-default">
        {{ CUSTOM_THEME_LIGHTNESS_TITLE }}
      </span>

      <span class="text-xs text-muted">{{ valueLabel }}</span>
    </div>

    <USlider
      v-model="sliderValue"
      :min="CUSTOM_THEME_PERCENT_RANGE.min"
      :max="CUSTOM_THEME_PERCENT_RANGE.max"
      size="sm"
      color="neutral"
    />
  </div>
</template>
