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
  import { ref, onMounted, computed, watch } from 'vue';

  import backgorundImage from '@/pages/Tools/Tokenator/assets/token-bg.webp';
  import defaultImage from '@/pages/Tools/Tokenator/assets/token-border.webp';

  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const contextRef = ref<CanvasRenderingContext2D | null>(null);
  const defaultImageRef = ref(new Image());
  const bgImageRef = ref(new Image());

  const props = defineProps<{
    source: FileList | null;
    scale: number;
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
            context.save();
            context.beginPath();

            context.arc(
              canvas.width / 2,
              canvas.height / 2,
              canvas.width / 2.4,
              0,
              Math.PI * 2
            );
            context.clip();
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(bgImageRef.value, x, y, newWidth, newHeight);
            context.restore();

            context.drawImage(defaultImageRef.value, x, y, newWidth, newHeight);
            contextRef.value = context;
          }
        })
        .catch(err => {
          // думаю здесь можно toast добавить
          console.log('ЧТО-ТО ПОШЛО НЕ ТАК', err);
        });
    }
  });

  watch([() => props.source, () => props.scale], ([source, scale]) => {
    console.log('test', source);

    if (source) {
      const selectedFile = source[0] as File;
      const img = new Image();

      console.log('test', selectedFile);
      img.src = URL.createObjectURL(selectedFile);
      console.log('img.src', img.src);

      img.onload = () => {
        if (canvasRef.value) {
          const newWidth = canvasRef.value.width * scale;
          const newHeight = canvasRef.value.height * scale;

          const x = (canvasRef.value.width - newWidth) / 2;
          const y = (canvasRef.value.height - newHeight) / 2;

          if (contextRef.value) {
            contextRef.value.drawImage(img, x, y, newWidth, newHeight);
          }
        }
      };
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
