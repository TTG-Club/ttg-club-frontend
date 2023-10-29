<template>
  <div :class="$style.container">
    <canvas
      id="canvasToken"
      ref="canvasRef"
      width="512"
      height="512"
      @mousedown="startDragging"
      @mouseup="stopDragging"
      @mousemove="dragElement"
    />
  </div>
</template>
<script lang="ts" setup>
  import { ref, onMounted, watch } from 'vue';

  import backgorundImage from '@/pages/Tools/Tokenator/assets/token-bg.webp';
  import borderImage from '@/pages/Tools/Tokenator/assets/token-border.webp';

  import { redrawToken } from './redrawToken';

  import type { Events } from 'vue';

  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const contextRef = ref<CanvasRenderingContext2D | null>(null);
  const borderImageRef = ref<HTMLImageElement>(new Image());
  const bgImageRef = ref<HTMLImageElement>(new Image());
  const loadedImageRef = ref<HTMLImageElement | null>(null);
  const isDragging = ref<boolean>(false);
  const offsetX = ref<number>(0);
  const offsetY = ref<number>(0);
  const loadedImagePosition = ref({ x: 0, y: 0 });

  const props = defineProps<{
    source: File | null;
    scale: number;
    resetScale: () => void;
    showError: (msg: string) => void;
  }>();

  const startDragging = (event: Events['onMousedown']) => {
    const canvas = canvasRef.value;

    if (canvas) {
      isDragging.value = true;

      const rect = canvas.getBoundingClientRect();

      // считаем точку старта
      offsetX.value = event.clientX - rect.left - loadedImagePosition.value.x;
      offsetY.value = event.clientY - rect.top - loadedImagePosition.value.y;
    }
  };

  const stopDragging = () => {
    isDragging.value = false;
  };

  const dragElement = (event: Events['onMousemove']) => {
    if (isDragging.value) {
      const canvas = canvasRef.value;
      const context = contextRef.value;

      if (canvas && context) {
        const rect = canvas.getBoundingClientRect();

        // двигаем изображение за курсором
        const x = event.clientX - rect.left - offsetX.value;
        const y = event.clientY - rect.top - offsetY.value;

        loadedImagePosition.value.x = x;
        loadedImagePosition.value.y = y;

        redrawToken(
          canvas,
          context,
          borderImageRef.value,
          bgImageRef.value,
          loadedImageRef.value,
          props.scale,
          { x, y }
        );
      }
    }
  };

  const loadAndDrawAssets = (
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    image: HTMLImageElement | null = null
  ) => {
    borderImageRef.value.src = borderImage;
    bgImageRef.value.src = backgorundImage;

    Promise.all([
      new Promise(resolve => {
        bgImageRef.value.onload = resolve;
      }),
      new Promise(resolve => {
        borderImageRef.value.onload = resolve;
      })
    ])
      .then(() => {
        redrawToken(
          canvas,
          context,
          borderImageRef.value,
          bgImageRef.value,
          image,
          props.scale,
          loadedImagePosition.value
        );
      })
      .catch(() => {
        props.showError('Токенатор провалил спасбросок смерти.');
      });
  };

  onMounted(() => {
    const canvas = canvasRef.value;

    if (canvas) {
      const context = canvas.getContext('2d');

      if (context) {
        contextRef.value = context;
        loadAndDrawAssets(canvas, context);
      }
    }
  });

  watch([() => props.source, () => props.scale], ([source], [oldSource]) => {
    if (source !== oldSource) props.resetScale();

    if (source) {
      const selectedFile = source;
      const img = new Image();

      img.src = URL.createObjectURL(selectedFile);

      img.onload = () => {
        const context = contextRef.value;

        loadedImageRef.value = img;

        if (context) {
          loadAndDrawAssets(canvasRef.value!, context, loadedImageRef.value);
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
      transform: scale(0.5) translateY(-45%) translateX(-30%);
    }
  }
</style>
