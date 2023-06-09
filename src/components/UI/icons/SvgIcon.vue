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

  const props = withDefaults(defineProps<{
    icon: string;
    size?: string | number;
  }>(), {
    size: undefined
  });

  const iconName = computed(() => `#ttg-${ props.icon.replaceAll('/', '-') }`);

  const sizeCalculated = computed(() => {
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

<style lang="scss" module>
  .svg-icon {
    overflow: hidden;
    flex-shrink: 0;
    display: block;
    width: v-bind(sizeCalculated);
    height: v-bind(sizeCalculated);
    fill: currentColor;
  }
</style>
