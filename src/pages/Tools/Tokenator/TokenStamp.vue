<template>
  <svg
    ref="token"
    :class="$style.container"
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="`0 0 ${SVG_SIZE} ${SVG_SIZE}`"
  >
    <clipPath id="circle-clip">
      <circle
        :cx="SVG_SIZE / 2"
        :cy="SVG_SIZE / 2"
        r="210"
      />
    </clipPath>

    <g
      ref="container"
      clip-path="url(#circle-clip)"
    >
      <image
        :href="background"
        :width="SVG_SIZE"
        :height="SVG_SIZE"
      />

      <image
        ref="image"
        :width="SVG_SIZE * scale"
        :height="SVG_SIZE * scale"
        :x="offsetPos.x * scale"
        :y="offsetPos.y * scale"
        :href="file"
      />
    </g>

    <image
      :href="border"
      :class="$style.border"
      :width="SVG_SIZE"
      :height="SVG_SIZE"
    />
  </svg>
</template>
<script lang="ts" setup>
  import { useDraggable, useElementBounding } from '@vueuse/core';
  import { computed, ref, watch } from 'vue';

  import { useTokenator } from '@/pages/Tools/Tokenator/composable';

  type Position = { x: number; y: number };

  const { token, border, background, scale, file, SVG_SIZE } = useTokenator();

  const container = ref<SVGGElement>();
  const image = ref<SVGImageElement>();

  const tokenRect = useElementBounding(token);
  const imageRect = useElementBounding(image);

  const offsetPos = ref<Position>({ x: 0, y: 0 });

  const delta = computed(() => ({
    x: SVG_SIZE / imageRect.width.value,
    y: SVG_SIZE / imageRect.height.value
  }));

  useDraggable(image, {
    preventDefault: true,
    stopPropagation: true,
    onMove(position) {
      offsetPos.value = {
        x: (position.x - tokenRect.x.value) * delta.value.x,
        y: (position.y - tokenRect.y.value) * delta.value.y
      };
    }
  });

  watch(
    file,
    () => {
      const width = image.value?.width.baseVal.value || 0;
      const height = image.value?.height.baseVal.value || 0;

      offsetPos.value = {
        x: (SVG_SIZE - width) / 2 / scale.value,
        y: (SVG_SIZE - height) / 2 / scale.value
      };
    },
    {
      immediate: true
    }
  );
</script>
<style lang="scss" module>
  .container {
    width: 256px;
    height: 256px;
  }

  .border {
    pointer-events: none;
  }
</style>
