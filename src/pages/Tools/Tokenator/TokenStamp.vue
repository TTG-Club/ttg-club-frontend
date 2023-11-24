<template>
  <svg
    ref="token"
    :class="{
      [$style.container]: true,
      [$style.draggable]: !!file,
      [$style.dragging]: !!file && isDragging
    }"
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="`0 0 ${SVG_SIZE} ${SVG_SIZE}`"
    @click.left.exact.prevent="openHandler"
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

      <foreignObject
        v-if="!file"
        :height="SVG_SIZE"
        :width="SVG_SIZE"
        :x="0"
        :y="0"
        :class="$style.dropText"
      >
        <span>Перетащите ваше изображение сюда</span>
      </foreignObject>

      <svg
        v-show="file"
        ref="image"
        :x="offsetPos.x"
        :y="offsetPos.y"
        :width="size"
        :height="size"
      >
        <image
          width="100%"
          height="100%"
          :x="reflectImage ? '-100%' : 0"
          :href="file"
          :transform="reflectImage ? 'scale(-1, 1)' : 'scale(1, 1)'"
        />
      </svg>
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
  import { set, useDropZone, useElementBounding } from '@vueuse/core';
  import {
    type EventTypes,
    useDrag,
    usePinch,
    useWheel
  } from '@vueuse/gesture';
  import { computed, ref, watch } from 'vue';

  import { useTokenator } from '@/pages/Tools/Tokenator/composable';

  import isAppleDevice from '@/shared/helpers/isAppleDevice';

  type Position = { x: number; y: number };

  const {
    token,
    border,
    background,
    scale,
    file,
    reflectImage,
    centerImage,
    SVG_SIZE,
    scaleConfig,
    processFile,
    open
  } = useTokenator();

  const container = ref<SVGGElement>();
  const image = ref<SVGImageElement>();

  const isDragging = ref(false);
  const offsetPos = ref<Position>({ x: 0, y: 0 });

  const imageRect = useElementBounding(image);

  const size = computed(() => SVG_SIZE * scale.value);
  const delta = computed(() => SVG_SIZE / imageRect.width.value);
  const moveCompensate = computed(() => delta.value * scale.value);

  useDrag(
    ({ delta: [x, y], dragging, event }: EventTypes['drag']) => {
      event.preventDefault();

      set(isDragging, dragging);

      if (!dragging) {
        return;
      }

      set(offsetPos, {
        x: offsetPos.value.x + x * moveCompensate.value,
        y: offsetPos.value.y + y * moveCompensate.value
      });
    },
    {
      domTarget: token,
      preventWindowScrollY: true,
      filterTaps: true,
      eventOptions: {
        passive: false
      }
    }
  );

  useWheel(
    ({
      direction: [, dir],
      metaKey,
      ctrlKey,
      wheeling,
      velocity
    }: EventTypes['wheel']) => {
      if (!wheeling || !file.value) {
        return;
      }

      if (isAppleDevice && !metaKey) {
        return;
      }

      if (!isAppleDevice && !ctrlKey) {
        return;
      }

      scale.value += (scaleConfig.step / delta.value) * (velocity || 1) * dir;
    },
    {
      domTarget: token,
      preventWindowScrollY: true,
      filterTaps: true,
      axis: 'y',
      lockDirection: true,
      eventOptions: {
        passive: false
      }
    }
  );

  usePinch(
    ({ direction: [dir], pinching, event, velocity }: EventTypes['pinch']) => {
      event.preventDefault();

      if (!pinching || !file.value) {
        return;
      }

      scale.value += (scaleConfig.step / delta.value) * (velocity || 1) * dir;
    },
    {
      domTarget: token,
      filterTaps: true,
      preventWindowScrollY: true,
      eventOptions: {
        passive: false
      }
    }
  );

  watch(
    [file, centerImage],
    () => {
      const sideWidth = size.value || 0;

      set(offsetPos, {
        x: (SVG_SIZE - sideWidth) / 2,
        y: (SVG_SIZE - sideWidth) / 2
      });
    },
    {
      immediate: true,
      flush: 'post'
    }
  );

  watch(scale, (value, oldValue) => {
    const oldSize = SVG_SIZE * oldValue;
    const newSize = SVG_SIZE * value;

    set(offsetPos, {
      x: offsetPos.value.x - (newSize - oldSize) / 2,
      y: offsetPos.value.y - (newSize - oldSize) / 2
    });
  });

  useDropZone(token, {
    onDrop: files => processFile(files?.[0])
  });

  const openHandler = () => {
    if (file.value) {
      return;
    }

    open();
  };
</script>
<style lang="scss" module>
  .container {
    width: 280px;
    height: 280px;
    cursor: pointer;
  }

  .draggable {
    cursor: grab;
  }

  .dragging {
    cursor: grabbing;
  }

  .border {
    pointer-events: none;
  }

  .dropText {
    display: none;

    @include media-min($md) {
      display: block;
    }

    span {
      font-size: calc(var(--main-font-size) * 2);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      padding: calc((100% - 256px) / 2);
      text-align: center;
      color: #6a6a6a;
    }
  }
</style>
