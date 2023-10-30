<template>
  <div>
    <svg
      id="downloadable-token-svg"
      :width="TOKEN_SIZE"
      :height="TOKEN_SIZE"
      @mousedown="startDragging"
      @mouseup="stopDragging"
      @mousemove="dragElement"
    >
      <defs>
        <clipPath id="circle-clip">
          <circle
            :cx="TOKEN_SIZE / 2"
            :cy="TOKEN_SIZE / 2"
            r="210"
          />
        </clipPath>
      </defs>

      <image
        ref="backgroundImgRef"
        :width="TOKEN_SIZE"
        :height="TOKEN_SIZE"
        clip-path="url(#circle-clip)"
      />

      <image
        ref="loadedImageRef"
        :width="TOKEN_SIZE * props.scale"
        :height="TOKEN_SIZE * props.scale"
        :cx="loadedImagePosition.cx"
        :cy="loadedImagePosition.cy"
        clip-path="url(#circle-clip)"
      />

      <image
        ref="borderImgRef"
        :width="TOKEN_SIZE"
        :height="TOKEN_SIZE"
      />
    </svg>
  </div>
</template>
<script lang="ts" setup>
  import { ref, onMounted, watch } from 'vue';

  import backgorundImage from '@/pages/Tools/Tokenator/assets/token-bg.webp';
  import borderImage from '@/pages/Tools/Tokenator/assets/token-border.webp';

  import type { Events, Ref } from 'vue';

  type Position = { x: number; y: number };

  const TOKEN_SIZE = 512;

  const props = defineProps<{
    source: File | null;
    scale: number;
    resetScale: () => void;
    showError: (msg: string) => void;
  }>();

  const backgroundImgRef = ref<HTMLImageElement | null>(null);
  const borderImgRef = ref<HTMLImageElement | null>(null);
  const loadedImageRef = ref<HTMLImageElement | null>(null);

  const isDragging = ref<boolean>(false);
  const startPos = ref<Position>({ x: 0, y: 0 });
  const offsetPos = ref<Position>({ x: 0, y: 0 });
  const loadedImagePosition = ref({ cx: TOKEN_SIZE / 2, cy: TOKEN_SIZE / 2 });

  const setImage = (elementRef: Ref<HTMLImageElement | null>, source: string) =>
    elementRef?.value?.setAttribute('href', source);

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

  onMounted(() => {
    setImage(borderImgRef, borderImage);
    setImage(backgroundImgRef, backgorundImage);
  });

  watch([() => props.source, () => props.scale], ([source], [oldSource]) => {
    if (source !== oldSource) props.resetScale();

    if (source) {
      const selectedFile = source;
      const img = new Image();

      img.src = URL.createObjectURL(selectedFile);

      img.onload = () => {
        setImage(loadedImageRef, img.src);
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
      transform: scale(0.5) translateY(-45%) translateX(-30%);
    }
  }
</style>
