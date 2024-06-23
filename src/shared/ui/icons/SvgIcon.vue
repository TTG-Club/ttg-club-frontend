<script setup lang="ts">
  import { getIconName } from '@/shared/utils/icons';

  interface Props {
    icon: string;
    size?: string | number;
    raw?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
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
    props.raw ? defineComponent({ template: props.icon }) : undefined,
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

    svg {
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
