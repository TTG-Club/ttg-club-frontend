<template>
  <div :class="$style['ui-slider']">
    <ui-button
      type="text"
      color="text"
      icon="zoom/out"
      @click.left.exact.prevent="modelValue -= step"
    />

    <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
    <label :class="$style.input">
      <input
        v-model.number="modelValue"
        type="range"
        :min="min"
        :max="max"
        :step="step"
      />
    </label>

    <ui-button
      type="text"
      color="text"
      icon="zoom/in"
      @click.left.exact.prevent="modelValue += step"
    />
  </div>
</template>

<script lang="ts" setup>
  import { computed, toRefs, unref } from 'vue';

  import UiButton from '@/shared/ui/kit/button/UiButton.vue';

  const modelValue = defineModel<number>({ required: true });

  const props = withDefaults(
    defineProps<{
      min?: number;
      max?: number;
      step?: number;
    }>(),
    {
      min: 0.1,
      max: 2,
      step: 0.05
    }
  );

  const { min, max, step } = toRefs(props);

  const progress = computed(
    () => ((unref(modelValue) - unref(min)) / (unref(max) - unref(min))) * 100
  );
</script>

<style lang="scss" module>
  .ui-slider {
    --track-height: 0.25rem;
    --thumb-radius: 1.25rem;

    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;

    /* style the input element with type "range" */
    & input[type='range'] {
      position: relative;
      appearance: none;
      background: none;
      border-radius: 999px;
      z-index: 0;
      height: 100%;
      width: inherit;
      pointer-events: none;

      &::before {
        content: '';
        display: block;
        position: absolute;
        width: calc(v-bind(progress) * 1%);
        height: 100%;
        background: var(--primary);
        border-radius: 999px;
      }

      &::-webkit-slider-runnable-track {
        appearance: none;
        background: var(--bg-sub-menu);
        height: var(--track-height);
        border-radius: 999px;
      }

      &::-webkit-slider-thumb {
        position: relative;
        width: var(--thumb-radius);
        height: var(--thumb-radius);
        margin-top: calc((var(--track-height) - var(--thumb-radius)) / 2);
        background: var(--primary);
        border: 1px solid var(--bg-sub-menu);
        border-radius: 999px;
        pointer-events: all;
        appearance: none;
        z-index: 1;
      }

      &::-moz-range-track {
        appearance: none;
        background: var(--primary);
        height: var(--track-height);
        border-radius: 999px;
      }

      &::-moz-range-thumb {
        position: relative;
        box-sizing: border-box;
        width: var(--thumb-radius);
        height: var(--thumb-radius);
        margin-top: calc((var(--track-height) - var(--thumb-radius)) / 2);
        background: var(--primary);
        border: 1px solid var(--bg-sub-menu);
        border-radius: 999px;
        pointer-events: all;
        appearance: none;
        z-index: 1;
      }
    }
  }

  .input {
    display: flex;
    align-items: center;
  }
</style>
