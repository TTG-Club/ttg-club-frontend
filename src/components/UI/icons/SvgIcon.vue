<template>
  <svg
    aria-hidden="true"
    :class="$style['svg-icon']"
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <use :xlink:href="icon" />
  </svg>
</template>

<script setup lang="ts">
  import '@/common/utils/SvgRequire';
  import { computed } from 'vue';

  const props = withDefaults(defineProps<{
    icon: string;
    size?: string | number;
  }>(), {
    size: undefined
  });

  const icon = computed(() => `#ttg-${ props.icon.replaceAll('/', '-') }`);

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

<style lang="scss" module>
  .svg-icon {
    overflow: hidden;
    flex-shrink: 0;
    display: block;
    width: v-bind(size);
    height: v-bind(size);
    fill: currentColor;
  }
</style>
