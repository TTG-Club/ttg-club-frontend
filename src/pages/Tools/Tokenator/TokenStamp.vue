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

      <text
        v-if="!file"
        x="50%"
        y="43%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-size="24"
        fill="#6a6a6a"
      >
        Перетащите
      </text>

      <text
        v-if="!file"
        x="50%"
        y="50%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-size="24"
        fill="#6a6a6a"
      >
        ваше изображение
      </text>

      <text
        v-if="!file"
        x="50%"
        y="57%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-size="24"
        fill="#6a6a6a"
      >
        сюда
      </text>

      <svg
        :x="offsetPos.x"
        :y="offsetPos.y"
        :width="size.width"
        :height="size.height"
      >
        <image
          ref="image"
          :width="size.width"
          :height="size.height"
          :href="file"
          :x="REFLECTED_IMAGE_POSITION"
          :transform="transformScale"
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
  import { useDraggable, useElementBounding } from '@vueuse/core';
  import { computed, ref, watch, onMounted } from 'vue';

  import { useTokenator } from '@/pages/Tools/Tokenator/composable';

  type Position = { x: number; y: number };

  const {
    token,
    border,
    background,
    scale,
    file,
    reflectImage,
    centerImage,
    initDropZone,
    SVG_SIZE
  } = useTokenator();

  const container = ref<SVGGElement>();
  const image = ref<SVGImageElement>();

  const tokenRect = useElementBounding(token);
  const imageRect = useElementBounding(image);

  const offsetPos = ref<Position>({ x: 0, y: 0 });

  const size = computed(() => ({
    width: SVG_SIZE * scale.value,
    height: SVG_SIZE * scale.value
  }));

  const delta = computed(() => ({
    x: SVG_SIZE / imageRect.width.value,
    y: SVG_SIZE / imageRect.height.value
  }));

  const REFLECTED_IMAGE_POSITION = computed(() =>
    reflectImage.value ? -SVG_SIZE * scale.value : 0
  );

  const transformScale = computed(() =>
    reflectImage.value ? 'scale(-1, 1)' : 'scale(1, 1)'
  );

  const { isDragging } = useDraggable(image, {
    preventDefault: true,
    stopPropagation: true,
    onMove(position) {
      offsetPos.value = {
        x: (position.x - tokenRect.x.value) * delta.value.x * scale.value,
        y: (position.y - tokenRect.y.value) * delta.value.y * scale.value
      };
    }
  });

  watch(
    [file, centerImage],
    () => {
      const width = image.value?.width.baseVal.value || 0;
      const height = image.value?.height.baseVal.value || 0;

      offsetPos.value = {
        x: (SVG_SIZE - width) / 2,
        y: (SVG_SIZE - height) / 2
      };
    },
    {
      immediate: true
    }
  );

  watch(size, (value, oldValue) => {
    offsetPos.value = {
      x: offsetPos.value.x - (value.width - oldValue.width) / 2,
      y: offsetPos.value.y - (value.height - oldValue.height) / 2
    };
  });

  onMounted(() => initDropZone());
</script>
<style lang="scss" module>
  .container {
    width: 280px;
    height: 280px;
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
</style>
