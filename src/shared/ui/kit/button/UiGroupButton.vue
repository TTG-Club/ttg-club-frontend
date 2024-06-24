<script setup lang="ts">
  import type {
    ISharedButtonProps,
    TButtonType,
  } from '@/shared/ui/kit/button/UiButton';
  import { buttonGroupContextKey } from '@/shared/ui/kit/button/UiButton.const';

  const props = withDefaults(defineProps<ISharedButtonProps>(), {
    size: 'md',
    color: 'primary',
    nativeType: 'button',
    disabled: false,
    fullWidth: false,
  });

  provide(
    buttonGroupContextKey,
    reactive({
      type: 'default' as TButtonType,
      size: toRef(props, 'size'),
      color: toRef(props, 'color'),
      nativeType: toRef(props, 'nativeType'),
      disabled: toRef(props, 'disabled'),
    }),
  );
</script>

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

<style lang="scss" scoped>
  .ui-group-button {
    display: inline-flex;
    flex-direction: row;

    &.is-full-width {
      display: flex;
      width: 100%;

      :slotted(.ui-button) {
        flex: 1 1 auto;
      }
    }

    :slotted(.ui-button) {
      margin: 0;

      &:first-child:not(:last-child) {
        > button {
          border: {
            top-right-radius: 0;
            bottom-right-radius: 0;
          }
        }
      }

      &:not(:first-child):not(:last-child) {
        > button {
          border: {
            radius: 0;
          }
        }
      }

      &:last-child:not(:first-child) {
        > button {
          border: {
            top-left-radius: 0;
            bottom-left-radius: 0;
          }
        }
      }
    }
  }
</style>
