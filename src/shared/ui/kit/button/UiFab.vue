<script lang="ts" setup>
  import { computed, useCssModule } from 'vue';

  import { useAppBreakpoints } from '@/shared/composables/useAppBreakpoints';

  import type { ISharedButtonProps } from './UiButton';

  interface IFabProps
    extends Omit<ISharedButtonProps, 'fullWidth' | 'size' | 'color'> {
    icon: string;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  }

  const props = withDefaults(defineProps<IFabProps>(), {
    nativeType: 'button',
    disabled: false,
    position: 'bottom-right',
  });

  const $style = useCssModule();

  const positionClasses = computed(() =>
    Object.fromEntries(
      props.position
        .split('-')
        .map((p) => [$style[`ui-fab--position-${p}`], true]),
    ),
  );

  const greaterThanXl = useAppBreakpoints().greater('xl');
</script>

<template>
  <button
    :class="{
      [$style['ui-fab']]: true,
      ...positionClasses,
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
      &-top {
        top: var(--fab-y-offset);
      }

      &-right {
        right: var(--fab-x-offset);
      }

      &-bottom {
        bottom: var(--fab-y-offset);
      }

      &-left {
        left: calc(var(--fab-x-offset) + var(--navbar-width));
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

:
