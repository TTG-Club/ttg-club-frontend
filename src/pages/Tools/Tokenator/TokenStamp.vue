<template>
  <div
    :class="$style.container"
    @mouseleave="stopDragging"
  >
    <svg
      id="downloadable-token-svg"
      :width="TOKEN_SIZE"
      :height="TOKEN_SIZE"
      xmlns="http://www.w3.org/2000/svg"
    >
      <clipPath id="circle-clip">
        <circle
          :cx="HALF_TOKEN_SIZE"
          :cy="HALF_TOKEN_SIZE"
          r="210"
        />
      </clipPath>

      <g clip-path="url(#circle-clip)">
        <circle
          :cx="HALF_TOKEN_SIZE"
          :cy="HALF_TOKEN_SIZE"
          r="210"
          fill="lightgray"
        />

        <image :xlink:href="getImageSource(backgroundImage)" />

        <image
          ref="loadedImageRef"
          :width="TOKEN_SIZE * props.scale"
          :height="TOKEN_SIZE * props.scale"
          :cx="loadedImagePosition.cx"
          :cy="loadedImagePosition.cy"
          :xlink:href="sourceImage"
          @mousedown.prevent.capture="startDragging"
          @mouseup.prevent.capture="stopDragging"
          @mousemove.prevent.capture="dragElement"
        />
      </g>

      <image
        :xlink:href="getImageSource(borderImage)"
        :class="$style.borderImage"
      />
    </svg>
  </div>
</template>
<script lang="ts" setup>
  import { ref, watch } from 'vue';

  import backgroundImage from '@/pages/Tools/Tokenator/assets/token-bg.webp';
  import borderImage from '@/pages/Tools/Tokenator/assets/token-border.webp';

  import type { Events } from 'vue';

  type Position = { x: number; y: number };

  const TOKEN_SIZE = 512;
  const HALF_TOKEN_SIZE = TOKEN_SIZE / 2;
  const MAX_DIMENSION = 2000;

  const props = defineProps<{
    source: File | null;
    scale: number;
    resetScale: () => void;
    showError: (msg: string) => void;
  }>();

  const loadedImageRef = ref<HTMLImageElement | null>(null);
  const sourceImage = ref();

  const isDragging = ref<boolean>(false);
  const startPos = ref<Position>({ x: 0, y: 0 });
  const offsetPos = ref<Position>({ x: 0, y: 0 });
  const loadedImagePosition = ref({ cx: TOKEN_SIZE / 2, cy: TOKEN_SIZE / 2 });

  const getImageSource = (file: string) => {
    const img = new Image();

    img.src = file;

    return img.src;
  };

  const startDragging = (event: Events['onMousedown']) => {
    isDragging.value = true;

    // считаем точку старта
    startPos.value.x = event.clientX - offsetPos.value.x;
    startPos.value.y = event.clientY - offsetPos.value.y;
  };

  const stopDragging = () => {
    isDragging.value = false;
  };

  const dragElement = (event: Events['onMousemove']) => {
    if (isDragging.value) {
      offsetPos.value.x = event.clientX - startPos.value.x;
      offsetPos.value.y = event.clientY - startPos.value.y;

      if (loadedImageRef.value) {
        loadedImageRef.value.style.transform = `translate(${offsetPos.value.x}px, ${offsetPos.value.y}px)`;
      }
    }
  };

  watch([() => props.source], ([source]) => {
    if (source) {
      const img = new Image();
      const file = URL.createObjectURL(source);

      img.src = file;

      // eslint-disable-next-line func-names
      img.onload = function () {
        // проверяем размеры изображения, когда оно загрузилось
        if (img.height >= MAX_DIMENSION || img.width >= MAX_DIMENSION) {
          props.showError('Ширина или высота файла выше допустимого.');
        } else {
          const reader = new FileReader();

          reader.onload = () => {
            sourceImage.value = reader.result;
          };

          reader.readAsDataURL(source);
        }
      };
    }
  });
</script>
<style lang="scss" module>
  .container {
    height: fit-content;
    background-size: contain;
    width: 512px;
    height: 512px;
    transform: scale(0.5) translateY(-30%);
    @include media-min($md) {
      transform: scale(0.5) translateY(-43%) translateX(-38%);
    }
  }
  .borderImage {
    pointer-events: none;
  }
</style>
