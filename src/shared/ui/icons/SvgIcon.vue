<template>
  <svg
    aria-hidden="true"
    :class="$style['svg-icon']"
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <use :xlink:href="iconName" />
  </svg>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  const props = withDefaults(
    defineProps<{
      icon: string;
      size?: string | number;
      color?: string | 'currentColor';
    }>(),
    {
      size: '100%',
      color: 'currentColor'
    }
  );

  const iconName = computed(() => `#ttg-${props.icon.replace(/\//g, '-')}`);

  const sizeCalculated = computed(() => {
    if (!props.size) {
      return '100%';
    }

    if (typeof props.size === 'number' || /^\d+$/i.test(props.size)) {
      return `${props.size}px`;
    }

    if (
      !props.size.endsWith('px') &&
      !props.size.endsWith('%') &&
      !props.size.endsWith('em')
    ) {
      throw new Error('SvgIcon: size is incorrect');
    }

    return props.size;
  });

  const colorCalculated = computed(() => {
    if (!props.color) {
      return 'currentColor';
    }

    if (/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(props.color)) {
      return props.color.startsWith('#') ? props.color : `#${props.color}`;
    }

    if (props.color.startsWith('--')) {
      return `var(${props.color}, currentColor)`;
    }

    if (/^var\(.+\)$/i.test(props.color)) {
      return props.color;
    }

    return 'currentColor';
  });
</script>

<style lang="scss" module>
  .svg-icon {
    overflow: hidden;
    flex-shrink: 0;
    display: block;
    width: v-bind(sizeCalculated);
    height: v-bind(sizeCalculated);
    fill: v-bind(colorCalculated);
  }
</style>
