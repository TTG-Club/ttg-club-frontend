<template>
  <div :class="$style.container">
    <canvas
      id="canvasToken"
      ref="canvasRef"
      width="280"
      height="280"
    />
  </div>
</template>
<script lang="ts" setup>
  import { ref, onMounted, watch } from 'vue';

  import backgorundImage from '@/pages/Tools/Tokenator/assets/token-bg.webp';
  import borderImage from '@/pages/Tools/Tokenator/assets/token-border.webp';

  import { redrawToken } from './redrawToken';

  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const contextRef = ref<CanvasRenderingContext2D | null>(null);
  const borderImageRef = ref<HTMLImageElement>(new Image());
  const bgImageRef = ref<HTMLImageElement>(new Image());

  const props = defineProps<{
    source: FileList | null;
    scale: number;
    resetScale: () => void;
    // tokenBorder?: File, // на будущее
  }>();

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

        console.log('test', selectedFile);
        img.src = URL.createObjectURL(selectedFile);
        console.log('img.src', img.src);

        img.onload = () => {
          const context = contextRef.value;

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
                  img,
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
