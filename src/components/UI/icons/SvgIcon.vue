<template>
  <svg
    :class="classList"
    aria-hidden="true"
    class="svg-icon"
    role="img"
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <use :xlink:href="name" />
  </svg>
</template>

<script setup lang="ts">
  import '@/common/utils/SvgRequire';
  import { computed } from 'vue';

  const props = withDefaults(defineProps<{
    iconName: string;
    strokeEnable?: boolean;
    fillEnable?: boolean;
    size?: string | number;
  }>(), {
    strokeEnable: true,
    fillEnable: false,
    size: undefined
  });

  const name = computed(() => `#dnd5club-icon-${ props.iconName }`);

  const classList = computed(() => ({
    'svg-color--stroke': !props.fillEnable,
    'svg-color--fill': props.fillEnable,
    'svg-color': props.fillEnable && props.strokeEnable
  }));

  const size = computed(() => {
    if (!props.size) {
      return '100%';
    }

    if (typeof props.size === 'number') {
      return `${ props.size }px`;
    }

    if (!props.size.endsWith('px') && !props.size.endsWith('%') && !props.size.endsWith('em')) {
      throw new Error('SvgIcon: size is incorrect');
    }

    return props.size;
  });
</script>

<style lang="scss">
  .svg-icon {
    overflow: hidden;
    flex-shrink: 0;
    display: block;
    width: v-bind(size);
    height: v-bind(size);

    &.svg-color {
      stroke: currentColor;
      fill: currentColor;

      &--stroke {
        stroke: currentColor;
        fill: none;
      }

      &--fill {
        fill: currentColor;
        stroke: none;
      }
    }
  }
</style>
