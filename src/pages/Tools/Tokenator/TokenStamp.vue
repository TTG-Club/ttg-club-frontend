<template>
  <div :class="$style.container">
    <canvas
      id="canvasToken"
      ref="canvasRef"
      width="280"
      height="280"
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

  const props = defineProps<{
    source: FileList | null;
    scale: number;
    resetScale: () => void;
    // tokenBorder?: File, // на будущее
  }>();

  const startDragging = (event: Events['onMousedown']) => {
    const canvas = canvasRef.value;

    if (canvas) {
      isDragging.value = true;

      const rect = canvas.getBoundingClientRect();

      offsetX.value = event.clientX - rect.left;
      offsetY.value = event.clientY - rect.top;
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

        context.clearRect(0, 0, canvas.width, canvas.height);

        const x = event.clientX - rect.left - offsetX.value;
        const y = event.clientY - rect.top - offsetY.value;

        redrawToken(
          canvasRef.value!,
          contextRef.value!,
          borderImageRef.value,
          bgImageRef.value,
          loadedImageRef.value,
          props.scale,
          { x, y }
        );
      }
    }
  };

  onMounted(() => {
    const canvas = canvasRef.value;

    if (canvas) {
      const context = canvas.getContext('2d');

      contextRef.value = context;

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
          if (context) {
            redrawToken(
              canvasRef.value!,
              contextRef.value!,
              borderImageRef.value,
              bgImageRef.value,
              null,
              props.scale
            );
          }
        })
        .catch(err => {
          // думаю здесь можно toast добавить
          console.log('ЧТО-ТО ПОШЛО НЕ ТАК', err);
        });
    }
  });

  watch(
    [() => props.source, () => props.scale],
    ([source, scale], [oldSource]) => {
      if (source !== oldSource) props.resetScale();

      if (source) {
        const selectedFile = source[0] as File;
        const img = new Image();

        img.src = URL.createObjectURL(selectedFile);

        img.onload = () => {
          const context = contextRef.value;

          loadedImageRef.value = img;
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
              if (context) {
                redrawToken(
                  canvasRef.value!,
                  contextRef.value!,
                  borderImageRef.value,
                  bgImageRef.value,
                  loadedImageRef.value,
                  scale
                );
              }
            })
            .catch(err => {
              // думаю здесь можно toast добавить
              console.log('ЧТО-ТО ПОШЛО НЕ ТАК', err);
            });
        };
      }
    }
  );
</script>
<style lang="scss" module>
  .container {
    position: relative;
    margin: 14px 0 0;
    height: fit-content;
    background-size: contain;
    width: 280px;
    height: 280px;
    overflow: hidden;
    @include media-min($md) {
      margin: 14px 42px;
    }
  }
  .image {
  }
</style>
