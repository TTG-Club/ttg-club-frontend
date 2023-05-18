<template>
  <div
    :class="{
      'ui-group-button': true,
      'is-full-width': fullWidth,
    }"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
  import {
    provide, reactive, toRef
  } from 'vue';
  import type { ISharedButtonProps, TButtonType } from '@/components/UI/kit/button/UiButton.types';
  import { buttonGroupContextKey } from '@/components/UI/kit/button/UiButton.const';

  const props = withDefaults(defineProps<ISharedButtonProps>(), {
    size: 'md',
    color: 'primary',
    nativeType: 'button',
    disabled: false,
    fullWidth: false
  });

  const type: TButtonType = 'default';

  provide(buttonGroupContextKey, reactive({
    type,
    size: toRef(props, 'size'),
    color: toRef(props, 'color'),
    nativeType: toRef(props, 'nativeType'),
    disabled: toRef(props, 'disabled')
  }));
</script>

<style lang="scss" scoped>
  .ui-group-button {
    display: inline-flex;
    flex-direction: row;

    &.is-full-width {
      display: flex;
      width: 100%;

      :slotted(.ui-button) {
        display: flex;
        flex: 1 1 auto;
      }
    }

    :slotted(.ui-button) {
      &:first-child {
        border: {
          top-right-radius: 0;
          bottom-right-radius: 0;
        };
      }

      &:not(:first-child):not(:last-child) {
        border: {
          radius: 0;
        };
      }

      &:last-child {
        border: {
          top-left-radius: 0;
          bottom-left-radius: 0;
        };
      }
    }
  }
</style>
