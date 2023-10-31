<template>
  <svg
    ref="token"
    :class="$style.container"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
  >
    <clipPath id="circle-clip">
      <circle
        :cx="256"
        :cy="256"
        r="210"
      />
    </clipPath>

    <g
      ref="container"
      clip-path="url(#circle-clip)"
    >
      <image
        :href="background"
        :width="512"
        :height="512"
      />

      <image
        ref="image"
        :width="512 * scale"
        :height="512 * scale"
        :x="offsetPos.x * scale"
        :y="offsetPos.y * scale"
        :href="file"
      />
    </g>

    <image
      :href="border"
      :class="$style.border"
      :width="512"
      :height="512"
    />
  </svg>
</template>
<script lang="ts" setup>
  import { useDraggable } from '@vueuse/core';
  import { ref, watch } from 'vue';

  import { useTokenator } from '@/pages/Tools/Tokenator/composable';

  type Position = { x: number; y: number };

  const { token, border, background, scale, file } = useTokenator();

  const container = ref<SVGGElement>();
  const image = ref<HTMLImageElement>();

  const startPos = ref<Position>({ x: 0, y: 0 });
  const offsetPos = ref<Position>({ x: 0, y: 0 });

  useDraggable(image, {
    preventDefault: true,
    stopPropagation: true,
    onStart(_position, e) {
      startPos.value.x = e.offsetX;
      startPos.value.y = e.offsetY;
    },
    onMove(_position, e) {
      offsetPos.value.x = (e.offsetX - startPos.value.x) * scale.value;
      offsetPos.value.y = (e.offsetY - startPos.value.y) * scale.value;
    }
  });

  watch(file, source => {
    if (source) {
      offsetPos.value = { x: 0, y: 0 };
    }
  });
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
