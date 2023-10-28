<template>
  <button
    type="button"
    :class="{
      [$style.chip]: true,
      [$style['is-active']]: value,
      [$style[`size-${chipSize}`]]: true,
      [$style[`type-${chipType}`]]: true,
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
    type: 'primary',
    modelValue: true
  });

  const chipSize = computed(() => props.size);
  const chipVariant = computed(() => props.variant);
  const chipType = computed(() => props.type);
  const value = computed(() => props.modelValue);
</script>

<style lang="scss" module>
  @use 'src/assets/styles/variables/mixins' as mixins;

  .chip {
    background-color: var(--primary);
    color: var(--text-btn-color);
    font-weight: 400;
    position: relative;
    overflow: hidden;

    &.is-active {
      background-color: var(--primary);
    }

    // before for hover, after for disabled
    &::after,
    &::before {
      @include mixins.css_anim($item: opacity);

      content: '';
      display: block;
      position: absolute;
      width: 100%;
      height: 100%;
      left: 0;
      top: 0;
    }

    &::before {
      background-color: black;
      opacity: 0;
      z-index: 1;
    }

    &:hover {
      &::before {
        opacity: 0.15;
      }
    }
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

  .caption {
    position: relative;
    z-index: 2;
  }
</style>
