<template>
  <button
    :class="{
      'ui-button': true,
      [`type-${ buttonType }`]: true,
      [`size-${ buttonSize }`]: true,
      ['is-disabled']: isDisabled,
      ['is-full-with']: props.fullWidth,
      ['is-loading']: props.loading,
    }"
    :disabled="disabled"
    :type="nativeType"
    :aria-disabled="isDisabled"
  >
    <span
      v-if="!isDisabled"
      class="hover"
    />

    <span
      :class="{
        body: true,
        [`icon-${ props.iconPosition }`]: true,
        'with-icon': hasIcon,
      }"
    >
      <span
        v-if="loading"
        class="icon"
      >
        <svg-icon
          icon-name="loading"
          :stroke-enable="false"
          fill-enable
        />
      </span>

      <span
        v-else-if="icon || !!$slots.icon"
        class="icon"
      >
        <svg-icon
          v-if="icon"
          :icon-name="icon"
          :stroke-enable="false"
          fill-enable
        />

        <slot
          v-else
          name="icon"
        />
      </span>

      <span v-if="$slots.default">
        <slot name="default" />
      </span>
    </span>

    <span
      v-if="isDisabled"
      class="disabled"
    />
  </button>
</template>

<script setup lang="ts">
  import {
    computed, inject, useSlots
  } from 'vue';
  import SvgIcon from '@/components/UI/icons/SvgIcon.vue';
  import type {
    ISharedButtonProps, TButtonIconPosition, TButtonType
  } from '@/components/UI/kit/button/UiButton.types';
  import { buttonGroupContextKey } from '@/components/UI/kit/button/UiButton.const';

  interface IProps extends ISharedButtonProps {
    type?: TButtonType;
    iconPosition?: TButtonIconPosition;
    icon?: string;
    loading?: boolean;
  }

  const props = withDefaults(defineProps<IProps>(), {
    type: 'default',
    size: 'md',
    color: 'primary',
    iconPosition: 'left',
    icon: undefined,
    disabled: false,
    loading: false,
    fullWidth: false,
    nativeType: 'button'
  });

  const slots = useSlots();

  const groupContext = inject(buttonGroupContextKey, undefined);

  const buttonType = computed(() => groupContext?.type || props.type || 'default');
  const buttonColor = computed(() => `var(--${ groupContext?.color || props.color || 'primary' })`);
  const buttonSize = computed(() => groupContext?.size || props.size || 'md');
  const isDisabled = computed(() => groupContext?.disabled || props.disabled || props.loading);
  const hasIcon = computed(() => props.icon || !!slots.icon || props.loading);
</script>

<style lang="scss" scoped>
  .hover,
  .disabled {
    @include css_anim();

    content: '';
    display: block;
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .hover {
    opacity: 0;
    background-color: black;
    z-index: 1;
  }

  .body {
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    gap: 8px;

    &.icon {
      &-left {
        flex-direction: row;
      }

      &-right {
        flex-direction: row-reverse;
      }
    }
  }

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
  }

  .disabled {
    z-index: 3;
    background-color: white;
    opacity: 20%;
    cursor: not-allowed;
  }

  .ui-button {
    color: var(--text-btn-color);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 0;
    flex-shrink: 0;
    border: {
      radius: 8px;
      width: 1px;
      style: solid;
      color: var(--border);
    };

    & + & {
      margin-left: 8px;
    }

    &:hover {
      .hover {
        opacity: 10%;
      }
    }

    &.size {
      &-md {
        font-size: 14px;
        line-height: 18px;
      }
    }

    &.type {
      &-default {
        background-color: v-bind(buttonColor);
        border: {
          width: 0;
        };

        .body {
          padding: 10px;

          &.with-icon {
            padding: 7px;
          }
        }
      }

      &-secondary {
        background-color: var(--bg-secondary);

        .body {
          padding: 9px;

          &.with-icon {
            padding: 6px;
          }
        }
      }

      &-outline {
        background-color: transparent;

        .body {
          padding: 9px;

          &.with-icon {
            padding: 6px;
          }
        }
      }

      &-text {
        background-color: transparent;
        color: v-bind(buttonColor);
        border: {
          width: 0;
        };

        .body {
          padding: 10px;

          &.with-icon {
            padding: 7px;
          }
        }
      }
    }
  }
</style>
