<template>
  <button
    :class="{
      [$style['ui-fab']]: true
    }"
    :type="nativeType"
    v-bind="$attrs"
  >
    <span :class="$style['ui-fab__inner']">
      <svg-icon
        :size="greaterThanXl ? 32 : 24"
        :icon="icon"
      />
    </span>
  </button>
</template>

<script lang="ts" setup>
  import { useCssModule } from 'vue';

  import { useAppBreakpoints } from '@/shared/composables/useAppBreakpoints';

  import type { ISharedButtonProps } from './UiButton';

  interface IFabProps
    extends Omit<ISharedButtonProps, 'fullWidth' | 'size' | 'color'> {
    icon: string;
  }

  withDefaults(defineProps<IFabProps>(), {
    nativeType: 'button',
    disabled: false
  });

  const greaterThanXl = useAppBreakpoints().greater('xl');

  const $style = useCssModule();
</script>

<style lang="scss" module>
  @use '@/assets/styles/variables/breakpoints' as *;

  .ui-fab {
    $root: &;

    --size: 32px;

    padding: 0;
    color: var(--text-b-color);
    border-radius: 50%;
    width: var(--size);
    height: var(--size);
    background-color: var(--bg-sub-menu);
    border: 1px solid var(--border);
    box-shadow: 0 1px 1px 0 rgb(0 0 0 / 25%);
    overflow: hidden;

    @include media-min($xl) {
      --size: 50px;
    }

    &:hover {
      #{$root}__inner::before {
        opacity: 15%;
      }
    }

    &__inner {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 100%;
      height: 100%;

      &::before {
        position: absolute;
        inset: 0;
        content: '';
        opacity: 0;
        background-color: black;
        @include css_anim;
      }
    }
  }
</style>
