<!-- eslint-disable vuejs-accessibility/form-control-has-label -->
<template>
  <div :class="[$style['custom-slider'], $style.default]">
    <input
      ref="slider"
      :value="sliderValue"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :class="$style.slider"
      @input="handleInput"
    />
  </div>
</template>

<script lang="ts" setup>
  import { ref, watchEffect, watch } from 'vue';

  import type { Events } from 'vue';

  const { min, max, step, modelValue } = defineProps({
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 100
    },
    step: {
      type: Number,
      default: 1
    },
    modelValue: {
      type: Number,
      default: 50
    }
  });

  const emit = defineEmits(['update:modelValue']);

  const sliderValue = ref(modelValue);
  const slider = ref<HTMLInputElement | null>(null);

  const handleInput = (event: Events['onInput']) => {
    const { value } = event.target as HTMLInputElement;

    sliderValue.value = parseFloat(value);
  };

  const getProgress = (value: number, minValue: number, maxValue: number) => {
    return ((value - minValue) / (maxValue - minValue)) * 100;
  };

  const setCSSProgress = (progress: number) => {
    slider.value?.style.setProperty('--ProgressPercent', `${progress}%`);
  };

  watch(
    () => modelValue,
    value => {
      sliderValue.value = value;
    }
  );

  watchEffect(() => {
    if (slider.value) {
      emit('update:modelValue', sliderValue.value);

      const progress = getProgress(
        sliderValue.value,
        Number(slider.value.min),
        Number(slider.value.max)
      );

      setCSSProgress(progress);
    }
  });
</script>

<style lang="scss" module>
  .custom-slider {
    --trackHeight: 0.25rem;
    --thumbRadius: 1.25rem;
    width: 100%;
  }

  /* style the input element with type "range" */
  .custom-slider input[type='range'] {
    position: relative;
    appearance: none;
    background: none;
    border-radius: 999px;
    z-index: 0;
    height: 100%;
    width: inherit;
    pointer-events: none;
  }

  /* ::before element to replace the slider track */
  .custom-slider input[type='range']::before {
    content: '';
    display: block;
    position: absolute;
    width: var(--ProgressPercent, 100%);
    height: 100%;
    background: var(--primary);
    border-radius: 999px;
  }

  .custom-slider input[type='range']::-webkit-slider-runnable-track {
    appearance: none;
    background: var(--bg-sub-menu);
    height: var(--trackHeight);
    border-radius: 999px;
  }

  .custom-slider input[type='range']::-webkit-slider-thumb {
    position: relative;
    width: var(--thumbRadius);
    height: var(--thumbRadius);
    margin-top: calc((var(--trackHeight) - var(--thumbRadius)) / 2);
    background: var(--primary);
    border: 1px solid var(--bg-sub-menu);
    border-radius: 999px;
    pointer-events: all;
    appearance: none;
    z-index: 1;
  }
  .custom-slider.default input[type='range']::-moz-range-track {
    appearance: none;
    background: var(--primary);
    height: var(--trackHeight);
    border-radius: 999px;
  }

  .custom-slider input[type='range']::-moz-range-thumb {
    position: relative;
    box-sizing: border-box;
    width: var(--thumbRadius);
    height: var(--thumbRadius);
    margin-top: calc((var(--trackHeight) - var(--thumbRadius)) / 2);
    background: var(--primary);
    border: 1px solid var(--bg-sub-menu);
    border-radius: 999px;
    pointer-events: all;
    appearance: none;
    z-index: 1;
  }
</style>
