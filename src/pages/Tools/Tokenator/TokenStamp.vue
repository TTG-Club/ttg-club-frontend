<template>
  <div :class="$style.container">
    <canvas
      ref="canvasRef"
      width="280"
      height="280"
    />
  </div>
</template>
<script lang="ts" setup>
  import { ref, onMounted, computed } from 'vue';

  import backgorundImage from '@/pages/Tools/Tokenator/assets/token-bg.webp';
  import defaultImage from '@/pages/Tools/Tokenator/assets/token-border.webp';

  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const defaultImageRef = ref(new Image());
  const bgImageRef = ref(new Image());

  defineProps<{
    source: File | null;
    // tokenBorder?: File, // на будущее
  }>();

  const scaleToFitFactor = computed(() => {
    const canvas = canvasRef.value;
    const image = defaultImageRef.value;

    if (canvas) {
      return Math.min(canvas.width / image.width, canvas.height / image.height);
    }

    return 1;
  });

  onMounted(() => {
    const canvas = canvasRef.value;

    if (canvas) {
      const context = canvas.getContext('2d');

      defaultImageRef.value.src = defaultImage;
      bgImageRef.value.src = backgorundImage;

      Promise.all([
        new Promise(resolve => {
          bgImageRef.value.onload = resolve;
        }),
        new Promise(resolve => {
          defaultImageRef.value.onload = resolve;
        })
      ])
        .then(() => {
          const scale = scaleToFitFactor.value;

          // так как размеры порядочные, нет смысла считать тоже самое для
          const newWidth = defaultImageRef.value.width * scale;
          const newHeight = defaultImageRef.value.height * scale;

          const x = (canvas.width - newWidth) / 2;
          const y = (canvas.height - newHeight) / 2;

          if (context) {
            context.beginPath();

            context.arc(
              canvas.width / 2,
              canvas.height / 2,
              canvas.width / 2,
              0,
              Math.PI * 2
            );
            context.clip();
            context.drawImage(bgImageRef.value, x, y, newWidth, newHeight);
            context.restore();

            context.drawImage(defaultImageRef.value, x, y, newWidth, newHeight);
          }
        })
        .catch(err => {
          console.log('ЧТО-ТО ПОШЛО НЕ ТАК', err);
        });
    }
  });
</script>
<style lang="scss" module>
  .container {
    position: relative;
    margin: 14px 42px;
    height: fit-content;
    background-size: contain;
    width: 280px;
    height: 280px;
    overflow: hidden;
  }
  .image {
  }
</style>
