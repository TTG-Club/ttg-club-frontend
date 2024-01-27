<template>
  <!-- eslint-disable vue/no-v-html -->
  <i
    v-if="icon && raw"
    :class="$style['svg-icon']"
    v-html="icon"
  />
  <!-- eslint-enable vue/no-v-html -->

  <i
    v-else-if="!error"
    :class="$style['svg-icon']"
    role="img"
  >
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <use :href="iconName" />
    </svg>
  </i>

  <span
    v-else
    :class="$style.error"
  >
    {{ error }}
  </span>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  import { getIconName } from '@/shared/utils/icons';

  const props = withDefaults(
    defineProps<{
      icon: string;
      size?: string | number;
      raw?: boolean;
    }>(),
    {
      size: 24,
      raw: false
    }
  );

  const iconName = computed(() => (!props.raw ? getIconName(props.icon) : ''));

  const sizeCalculated = computed(() => {
    if (/^\d+$/i.test(String(props.size))) {
      return `${props.size}px`;
    }

    if (/^\d+(px|em)$/i.test(String(props.size))) {
      return props.size;
    }

    console.error(`[SvgIcon]: size "${String(props.size)}" is incorrect.`);

    return undefined;
  });

  const error = computed(() => {
    if (!iconName.value) {
      return `[SvgIcon]: icon "${String(props.icon)}" not found.`;
    }

    if (!sizeCalculated.value) {
      return `[SvgIcon]: size "${String(props.size)}" is incorrect.`;
    }

    return '';
  });
</script>

<style lang="scss" module>
  .svg-icon {
    font-size: v-bind(sizeCalculated);
    overflow: hidden;
    flex-shrink: 0;
    display: inline-block;
    width: 1em;
    height: 1em;
    line-height: 1em;
    color: currentColor;
    fill: currentColor;
    text-align: center;
    transform: translateZ(0);

    > svg {
      width: 1em;
      height: 1em;
    }
  }

  .error {
    display: none !important;
    width: 0;
    height: 0;
    visibility: hidden;
    overflow: hidden;
  }
</style>
