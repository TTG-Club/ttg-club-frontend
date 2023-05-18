<template>
  <button
    :class="{
      [$style['ui-button']]: true,
      [$style[`type-${ props.type }`]]: true,
      [$style[`size-${ props.size }`]]: true,
      [$style['is-disabled']]: isDisabled,
      [$style['is-full-with']]: props.fullWidth,
      [$style['is-loading']]: props.loading,
    }"
    :disabled="disabled"
    type="button"
  >
    <span
      v-if="!isDisabled"
      :class="$style.hover"
    />

    <span
      :class="{
        [$style.body]: true,
        [$style[`icon-${ props.iconPosition }`]]: true,
        [$style['with-icon']]: hasIcon,
      }"
    >
      <span
        v-if="loading"
        :class="$style.icon"
      >
        <svg-icon
          icon-name="loading"
          :stroke-enable="false"
          fill-enable
        />
      </span>

      <span
        v-else-if="icon || !!$slots.icon"
        :class="$style.icon"
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

      <span>
        <slot name="default" />
      </span>
    </span>

    <span
      v-if="isDisabled"
      :class="$style.disabled"
    />
  </button>
</template>

<script setup lang="ts">
  import { computed, useSlots } from 'vue';
  import SvgIcon from '@/components/UI/icons/SvgIcon.vue';

  const props = withDefaults(defineProps<{
    type?: 'default' | 'secondary' | 'outline' | 'text';
    size?: 'sm' | 'md' | 'lg';
    color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
    iconPosition?: 'left' | 'right';
    icon?: string;
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
  }>(), {
    type: 'default',
    size: 'md',
    color: 'primary',
    iconPosition: 'left',
    icon: undefined,
    disabled: false,
    loading: false,
    fullWidth: false
  });

  const slots = useSlots();

  const color = computed(() => `var(--${ props.color })`);
  const isDisabled = computed(() => props.disabled || props.loading);
  const hasIcon = computed(() => props.icon || !!slots.icon || props.loading);
</script>

<style lang="scss" module>
  .hover,
  .disabled {
    @include css_anim();

    content: '';
    display: block;
    position: absolute;
    width: 100%;
    height: 100%;
    cursor: not-allowed;
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
  }

  .ui-button {
    color: var(--text-btn-color);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 0;
    border: {
      radius: 8px;
      width: 1px;
      style: solid;
      color: var(--border);
    };

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
        background-color: v-bind(color);
        border: {
          width: 0;
        };

        .body {
          padding: 10px 8px;

          &.with-icon {
            padding: 7px 8px;
          }
        }
      }

      &-secondary {
        background-color: var(--bg-secondary);

        .body {
          padding: 9px 8px;

          &.with-icon {
            padding: 6px 8px;
          }
        }
      }

      &-outline {
        background-color: transparent;

        .body {
          padding: 9px 8px;

          &.with-icon {
            padding: 6px 8px;
          }
        }
      }

      &-text {
        background-color: transparent;
        border: {
          width: 0;
        };

        .body {
          padding: 10px 8px;

          &.with-icon {
            padding: 7px 8px;
          }
        }
      }
    }
  }
</style>
