<script lang="ts" setup>
  import { useAppBreakpoints } from '@/shared/composables/useAppBreakpoints';
  import { useClassName } from '@/shared/composables/useClassName';

  import type { ISharedButtonProps } from './UiButton';

  interface IFabProps
    extends Omit<ISharedButtonProps, 'fullWidth' | 'size' | 'color'> {
    icon: string;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  }

  withDefaults(defineProps<IFabProps>(), {
    nativeType: 'button',
    disabled: false,
    position: 'bottom-right',
  });

  const cn = useClassName();

  const greaterThanXl = useAppBreakpoints().greater('xl');
</script>

<template>
  <button
    :class="cn({ position })"
    :type="nativeType"
    v-bind="$attrs"
  >
    <span :class="cn('inner')">
      <svg-icon
        :size="greaterThanXl ? 32 : 24"
        :icon="icon"
      />
    </span>
  </button>
</template>

<style lang="scss" module>
  @use '@/assets/styles/variables/breakpoints' as *;

  html {
    --fab-size: 32px;
    --fab-x-offset: 16px;
    --fab-y-offset: 24px;

    @include media-min($xl) {
      --fab-size: 50px;
    }
  }

  .ui-fab {
    $root: &;

    position: fixed;
    z-index: 50;
    width: var(--fab-size);
    height: var(--fab-size);
    padding: 0;
    overflow: hidden;
    color: var(--text-b-color);
    background-color: var(--bg-sub-menu);
    border: 1px solid var(--border);
    border-radius: 50%;
    box-shadow: 0 1px 1px 0 rgb(0 0 0 / 25%);

    &:hover {
      #{$root}__inner::before {
        opacity: 0.15;
      }
    }

    &--position {
      &-top-right {
        top: var(--fab-y-offset);
        right: var(--fab-x-offset);
      }

      &-top-left {
        top: var(--fab-y-offset);
        left: var(--fab-x-offset);
      }

      &-bottom-right {
        right: var(--fab-x-offset);
        bottom: var(--fab-y-offset);
      }

      &-bottom-left {
        bottom: var(--fab-y-offset);
        left: var(--fab-x-offset);
      }
    }

    &__inner {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;

      &::before {
        position: absolute;
        inset: 0;
        content: '';
        background-color: black;
        opacity: 0;
        @include css_anim;
      }
    }
  }
</style>
