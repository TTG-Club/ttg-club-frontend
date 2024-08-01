<!-- eslint-disable vuejs-accessibility/form-control-has-label -->
<script lang="ts" setup>
  import type { Events } from 'vue';

  const { min, max, step, minValue, maxValue } = defineProps({
    min: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      default: 100,
    },
    step: {
      type: Number,
      default: 1,
    },
    minValue: {
      type: Number,
      default: 50,
    },
    maxValue: {
      type: Number,
      default: 80,
    },
  });

  const emit = defineEmits(['update:minValue', 'update:maxValue']);

  const slider = ref<HTMLDivElement | null>(null);
  const inputMin = ref<HTMLInputElement | null>(null);
  const inputMax = ref<HTMLInputElement | null>(null);
  const sliderMinValue = ref(minValue);
  const sliderMaxValue = ref(maxValue);

  const getPercent = (value: number, minVal: number, maxVal: number) => {
    return ((value - minVal) / (maxVal - minVal)) * 100;
  };

  const setCSSProps = (left: number, right: number) => {
    slider.value?.style.setProperty('--progress-left', `${left}%`);
    slider.value?.style.setProperty('--progress-right', `${right}%`);
  };

  watchEffect(() => {
    if (slider.value) {
      emit('update:minValue', sliderMinValue.value);
      emit('update:maxValue', sliderMaxValue.value);

      const leftPercent = getPercent(sliderMinValue.value, min, max);
      const rightPercent = 100 - getPercent(sliderMaxValue.value, min, max);

      setCSSProps(leftPercent, rightPercent);
    }
  });

  const onInput = (event: Events['onInput']) => {
    const target = event.target as HTMLInputElement;

    if (target.name === 'min') {
      if (parseFloat(target.value) > sliderMaxValue.value) {
        target.value = String(sliderMaxValue.value);
      } else {
        sliderMinValue.value = parseFloat(target.value);
      }
    }

    if (target.name === 'max') {
      if (parseFloat(target.value) < sliderMinValue.value) {
        target.value = String(sliderMinValue.value);
      } else {
        sliderMaxValue.value = parseFloat(target.value);
      }
    }
  };
</script>

<template>
  <div
    ref="slider"
    :class="[$style['custom-slider'], $style.minmax]"
  >
    <div :class="$style['minmax-indicator']" />

    <input
      id="min"
      ref="inputMin"
      type="range"
      name="min"
      :min="min"
      :max="max"
      :value="minValue"
      :step="step"
      @input="onInput"
    />

    <input
      id="max"
      ref="inputMax"
      type="range"
      name="max"
      :min="min"
      :max="max"
      :value="maxValue"
      :step="step"
      @input="onInput"
    />
  </div>
</template>

<style lang="scss" module>
  .custom-slider {
    --track-height: 0.25rem;
    --thumb-radius: 1.25rem;

    width: 100%;

    input[type='range'] {
      pointer-events: none;

      position: relative;
      z-index: 0;

      height: 100%;

      appearance: none;
      background: none;
      border-radius: 999px;

      &::before {
        content: '';

        position: absolute;

        display: block;

        width: var(--progress-percent, 100%);
        height: 100%;

        background: var(--primary);
        border-radius: 999px;
      }

      &::-webkit-slider-runnable-track {
        height: var(--track-height);
        appearance: none;
        background: var(--primary);
        border-radius: 999px;
      }

      &::-webkit-slider-thumb {
        pointer-events: all;

        position: relative;
        z-index: 1;

        width: var(--thumb-radius);
        height: var(--thumb-radius);
        margin-top: calc((var(--track-height) - var(--thumb-radius)) / 2);

        appearance: none;
        background: var(--primary);
        border: 1px solid var(--bg-sub-menu);
        border-radius: 999px;
      }

      &::-moz-range-thumb {
        pointer-events: all;

        position: relative;
        z-index: 1;

        box-sizing: border-box;
        width: var(--thumb-radius);
        height: var(--thumb-radius);
        margin-top: calc((var(--track-height) - var(--thumb-radius)) / 2);

        appearance: none;
        background: var(--primary);
        border: 1px solid var(--bg-sub-menu);
        border-radius: 999px;
      }
    }
  }

  .custom-slider.default {
    input[type='range']::-moz-range-track {
      height: var(--track-height);
      appearance: none;
      background: var(--primary);
      border-radius: 999px;
    }
  }

  .custom-slider.minmax {
    --progress-left: 0%;
    --progress-right: 0%;

    position: relative;

    height: var(--track-height);
    margin: 0.5rem 0;

    background: var(--bg-sub-menu);
    border-radius: 999px;

    & input[type='range'] {
      position: absolute;
      width: calc(100% - var(--thumb-radius));

      &::before {
        display: none;
      }

      &::-webkit-slider-runnable-track {
        background: none;
      }
    }

    & [name='max'] {
      left: var(--thumb-radius);
    }
  }

  .custom-slider .minmax-indicator {
    pointer-events: none;

    position: absolute;
    right: var(--thumb-radius);
    left: var(--thumb-radius);

    height: 100%;

    &::before {
      content: '';

      position: absolute;
      right: var(--progress-right);
      left: var(--progress-left);

      height: 100%;

      background: var(--primary);
    }
  }
</style>
