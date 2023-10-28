<template>
  <button
    type="button"
    :class="{
      [$style.chip]: true,
      [$style['is-active']]: value,
      [$style[`size-${chipSize}`]]: true,
      [$style[`color-${chipColor}`]]: true,
      [$style[`variant-${chipVariant}`]]: true
    }"
  >
    <span
      v-if="$slots.default"
      :class="$style.caption"
    >
      <slot name="default" />
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
    modelValue: false
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
    position: relative;
    overflow: hidden;
  }

  .size {
    &-l {
      padding: 12px 24px;
      font-size: 16px;
      line-height: 24px;
      letter-spacing: 0.16px;
    }

    &-m,
    &-s {
      font-size: 14px;
      line-height: 20px;
      letter-spacing: 0.14px;
    }

    &-m {
      padding: 10px 20px;
    }

    &-s {
      padding: 8px 16px;
    }

    &-xs {
      padding: 2px 8px;
      font-size: 13px;
      line-height: 20px;
      letter-spacing: 0.13px;
    }
  }

  .variant {
    &-round {
      border-radius: 100px;
    }

    &-rectangle {
      border-radius: 8px;
    }
  }

  .color {
    &-primary {
      &.is-active {
        color: var(--text-btn-color);
        background-color: var(--primary);
      }

      &:hover {
        color: var(--text-btn-color);
        background-color: var(--primary-hover);
      }
    }

    &-secondary {
      &.is-active {
        background-color: var(--bg-sub-menu);
      }

      &:hover {
        background-color: var(--bg-secondary);
      }
    }
  }

  .caption {
    position: relative;
    z-index: 2;
  }
</style>
