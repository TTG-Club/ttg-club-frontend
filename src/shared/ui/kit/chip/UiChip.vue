<template>
  <button
    type="button"
    :disabled="!clickable"
    :class="{
      [$style.chip]: true,
      [$style['is-active']]: value,
      [$style[`size-${chipSize}`]]: true,
      [$style[`color-${chipColor}`]]: true,
      [$style[`variant-${chipVariant}`]]: true,
      [$style['has-icon']]: $slots.icon
    }"
  >
    <span
      v-if="$slots.default"
      :class="$style.caption"
    >
      <slot name="default" />
    </span>

    <span
      v-if="count !== undefined"
      :class="$style.counter"
      >{{ count }}</span
    >

    <span
      v-if="$slots.icon && count === undefined"
      :class="$style.icon"
    >
      <slot name="icon" />
    </span>
  </button>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  import type { IChipProps } from './UiChip';

  const props = withDefaults(defineProps<IChipProps>(), {
    size: 'm',
    variant: 'round',
    color: 'primary',
    clickable: true,
    modelValue: true
  });

  const chipSize = computed(() => props.size);
  const chipVariant = computed(() => props.variant);
  const chipColor = computed(() => props.color);
  const value = computed(() => props.modelValue);
</script>

<style lang="scss" module>
  @use 'src/assets/styles/variables/mixins' as mixins;

  .chip {
    $items: background-color, color;
    @include mixins.css_anim($item: $items);

    background-color: var(--hover);
    color: var(--text-color);
    font-weight: 400;
    overflow: hidden;
    display: flex;
    align-items: center;

    &:disabled {
      cursor: initial;
    }
  }

  .size {
    &-m,
    &-s {
      font-size: 14px;
      line-height: 20px;
      letter-spacing: 0.14px;
    }

    &-l {
      padding: 12px 24px;
      font-size: 16px;
      line-height: 24px;
      letter-spacing: 0.16px;

      &.has-icon {
        padding-right: 20px;
      }

      .icon {
        width: 24px;
        height: 24px;
      }

      .counter {
        padding: 2px 8px;
      }
    }

    &-m {
      padding: 10px 20px;

      &.has-icon {
        padding-right: 16px;
      }

      .icon {
        width: 22px;
        height: 22px;
      }

      .counter {
        padding: 2px 8px;
      }
    }

    &-s {
      padding: 8px 16px;

      &.has-icon {
        padding-right: 12px;
      }

      .icon {
        width: 20px;
        height: 20px;
      }
    }

    &-xs {
      padding: 4px 8px;
      font-size: 13px;
      line-height: 16px;
      letter-spacing: 0.13px;

      &.has-icon {
        padding-right: 4px;
      }

      .icon {
        width: 16px;
        height: 16px;
      }
    }
  }

  .variant {
    &-round {
      border-radius: 100px;

      .counter {
        border-radius: 100px;
      }
    }

    &-rectangle {
      border-radius: 8px;

      .counter {
        border-radius: 8px;
      }
    }
  }

  .color {
    &-primary {
      &.is-active {
        color: var(--text-btn-color);
        background-color: var(--primary);

        .counter {
          color: #1d282f;
          background-color: var(--text-btn-color);
        }
      }

      &:not(:disabled):hover {
        color: var(--text-btn-color);
        background-color: var(--primary-hover);
      }
    }

    &-secondary {
      .counter {
        color: currentColor;
      }

      &.is-active {
        background-color: var(--bg-sub-menu);

        .counter {
          background-color: var(--bg-secondary);
        }
      }

      &:not(:disabled):hover {
        background-color: var(--bg-secondary);
      }
    }
  }

  .caption {
    position: relative;
    z-index: 2;
  }

  .counter {
    padding: 0 6px;
    margin-left: 8px;
  }

  .icon {
    display: block;
    width: 24px;
    height: 24px;
    margin-left: 8px;
  }
</style>
