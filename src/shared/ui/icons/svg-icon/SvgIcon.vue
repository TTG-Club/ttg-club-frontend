<script setup lang="ts">
  import { getIconName } from '@/shared/utils/icons';

  import type { SvgIconProps } from './types';

  const props = withDefaults(defineProps<SvgIconProps>(), {
    size: '1em',
    raw: false,
  });

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

  const RawSvgIcon = computed(() =>
    props.raw && props.icon
      ? defineComponent({ template: props.icon })
      : undefined,
  );
</script>

<template>
  <n-icon
    v-if="icon && raw && RawSvgIcon"
    :class="$style.svgIcon"
  >
    <raw-svg-icon />
  </n-icon>

  <n-icon
    v-else-if="!error && !raw"
    :class="$style.svgIcon"
  >
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <use :href="iconName" />
    </svg>
  </n-icon>

  <span
    v-else
    :class="$style.error"
  >
    {{ error }}
  </span>
</template>

<style lang="scss" module>
  .svgIcon {
    transform: translateZ(0);

    overflow: hidden;
    display: inline-block;
    flex-shrink: 0;

    width: 1em;
    height: 1em;

    font-size: v-bind(sizeCalculated);
    line-height: 1em;
    color: currentColor;
    text-align: center;

    fill: currentColor;

    svg {
      width: 1em;
      height: 1em;
    }
  }

  .error {
    overflow: hidden;
    display: none !important;

    width: 0;
    height: 0;

    visibility: hidden;
  }
</style>
