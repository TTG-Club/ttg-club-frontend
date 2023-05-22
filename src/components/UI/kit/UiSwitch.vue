<template>
  <div
    :class="{
      'ui-switch': true,
      [$style['ui-switch']]: true,
      [$style['is-full-width']]: fullWidth,
    }"
  >
    <button
      v-for="(option, index) in options"
      :key="`${option[trackBy]}_${index}`"
      :class="{
        [$style.option]: true,
        [$style['is-active']]: selected?.[trackBy] === option[trackBy],
      }"
      type="button"
      @click.left.exact.prevent="selected = option"
    >
      <span :class="$style.hover" />

      <span :class="$style.text">{{ option[label] }}</span>
    </button>
  </div>
</template>

<script setup lang="ts" generic="OptionType extends Record<string | 'id' | 'name', any>">
  import { onBeforeMount } from 'vue';
  import { useVModel } from '@vueuse/core';
  import cloneDeep from 'lodash/cloneDeep';

  const props = withDefaults(defineProps<{
    modelValue: OptionType;
    options: Array<OptionType>;
    trackBy?: keyof OptionType;
    label?: keyof OptionType;
    preSelectFirst?: boolean;
    fullWidth?: boolean;
  }>(), {
    trackBy: 'id',
    label: 'name',
    preSelectFirst: false,
    fullWidth: false
  });

  const selected = useVModel(props, 'modelValue');

  onBeforeMount(() => {
    if (props.preSelectFirst) {
      selected.value = cloneDeep(props.options[0]);
    }
  });
</script>

<style lang="scss" module>
  $radius: 8px;

  .ui-switch {
    display: inline-flex;
    flex-direction: column;
    width: 100%;

    @include media-min($lg) {
      flex-direction: row;
      width: initial;
    }

    &.is-full-width {
      display: flex;
      width: 100%;

      > .option {
        flex: 1 1 auto;
      }
    }
  }

  .option {
    @include css_anim();

    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    gap: 8px;
    overflow: hidden;
    margin: 0;
    position: relative;
    font-size: 14px;
    line-height: 18px;
    padding: 10px;
    color: var(--text-color);
    background-color: var(--bg-secondary);

    &:first-child {
      border: {
        top-left-radius: $radius;
        top-right-radius: $radius;
      };

      @include media-min($lg) {
        border: {
          top-left-radius: $radius;
          top-right-radius: 0;
          bottom-left-radius: $radius;
        };
      }
    }

    &:last-child {
      border: {
        bottom-left-radius: $radius;
        bottom-right-radius: $radius;
      };

      @include media-min($lg) {
        border: {
          top-right-radius: $radius;
          bottom-left-radius: 0;
          bottom-right-radius: $radius;
        };
      }
    }

    &:hover {
      &:not(.is-active) {
        color: var(--text-btn-color);

        .hover {
          opacity: 1;
        }
      }
    }

    &.is-active {
      color: var(--text-btn-color);
      background-color: var(--primary);
    }
  }

  .text {
    position: relative;
    z-index: 1;
  }

  .disabled,
  .hover {
    @include css_anim();

    content: '';
    display: block;
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .hover {
    background-color: var(--primary-hover);
    opacity: 0;
    z-index: 1;
  }

  .disabled {
    z-index: 3;
    background-color: white;
    opacity: 20%;
    cursor: not-allowed;
  }
</style>
