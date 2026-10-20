<script setup lang="ts">
  import { onKeyStroke } from '@vueuse/core';
  import { ref, computed, watch, onMounted, nextTick, defineExpose } from 'vue';

  import {
    MAX_UNDO_STEPS,
    MODAL_CHROME_WIDTH,
  } from '@/features/bug-report/model';

  interface StrokePath {
    color: string;
    size: number;
    points: Array<{ x: number; y: number }>;
  }

  /** Рисует один штрих на canvas */
  function drawStroke(context: CanvasRenderingContext2D, stroke: StrokePath) {
    if (stroke.points.length < 2) {
      return;
    }

    const ctx = context;

    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const firstPoint = stroke.points[0];

    if (!firstPoint) {
      return;
    }

    ctx.moveTo(firstPoint.x, firstPoint.y);

    for (let i = 1; i < stroke.points.length; i++) {
      const point = stroke.points[i];

      if (point) {
        ctx.lineTo(point.x, point.y);
      }
    }

    ctx.stroke();
  }

  const props = defineProps<{
    /** Скриншот для отображения и рисования */
    screenshotUrl: string;

    /** Текущий цвет кисти */
    brushColor: string;

    /** Текущий размер кисти в пикселях */
    brushSize: number;
  }>();

  const canvasRef = ref<HTMLCanvasElement>();

  const isDrawing = ref(false);
  const strokes = ref<Array<StrokePath>>([]);
  const currentStroke = ref<StrokePath | null>(null);

  const backgroundImage = ref<HTMLImageElement>();
  const imageWidth = ref(0);
  const imageHeight = ref(0);
  const canvasWidth = ref(0);
  const canvasHeight = ref(0);

  /** Загружает изображение скриншота и вычисляет размер canvas по картинке */
  function loadBackgroundImage() {
    const image = new Image();

    image.onload = () => {
      backgroundImage.value = image;

      const maxWidth = Math.floor(window.innerWidth * 0.9 - MODAL_CHROME_WIDTH);
      const maxHeight = Math.floor(window.innerHeight * 0.6);

      let targetWidth = image.naturalWidth;
      let targetHeight = image.naturalHeight;

      // Ограничиваем по ширине
      if (targetWidth > maxWidth) {
        const scale = maxWidth / targetWidth;

        targetWidth = maxWidth;
        targetHeight = Math.floor(targetHeight * scale);
      }

      // Ограничиваем по высоте
      if (targetHeight > maxHeight) {
        const scale = maxHeight / targetHeight;

        targetHeight = maxHeight;
        targetWidth = Math.floor(targetWidth * scale);
      }

      imageWidth.value = targetWidth;
      imageHeight.value = targetHeight;

      // Минимальный размер холста
      canvasWidth.value = Math.max(targetWidth, 300);
      canvasHeight.value = Math.max(targetHeight, 200);

      nextTick(() => redrawCanvas());
    };

    image.src = props.screenshotUrl;
  }

  /** Полностью перерисовывает canvas: фон + все штрихи */
  function redrawCanvas() {
    const canvas = canvasRef.value;
    const context = canvas?.getContext('2d');

    if (!canvas || !context || !backgroundImage.value) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);

    const x = Math.floor((canvas.width - imageWidth.value) / 2);
    const y = Math.floor((canvas.height - imageHeight.value) / 2);

    context.drawImage(
      backgroundImage.value,
      x,
      y,
      imageWidth.value,
      imageHeight.value,
    );

    for (const stroke of strokes.value) {
      drawStroke(context, stroke);
    }

    if (currentStroke.value) {
      drawStroke(context, currentStroke.value);
    }
  }

  /** Вычисляет координаты курсора относительно canvas */
  function getCanvasPoint(event: MouseEvent): { x: number; y: number } {
    const canvas = canvasRef.value;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function handleMouseDown(event: MouseEvent) {
    isDrawing.value = true;

    const point = getCanvasPoint(event);

    currentStroke.value = {
      color: props.brushColor,
      size: props.brushSize,
      points: [point],
    };
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isDrawing.value || !currentStroke.value) {
      return;
    }

    const point = getCanvasPoint(event);

    currentStroke.value.points.push(point);
    redrawCanvas();
  }

  function handleMouseUp() {
    if (!isDrawing.value || !currentStroke.value) {
      return;
    }

    isDrawing.value = false;

    if (currentStroke.value.points.length >= 2) {
      strokes.value.push(currentStroke.value);

      if (strokes.value.length > MAX_UNDO_STEPS) {
        strokes.value.shift();
      }
    }

    currentStroke.value = null;
    redrawCanvas();
  }

  /** Отменяет последний штрих */
  function undo() {
    if (strokes.value.length === 0) {
      return;
    }

    strokes.value.pop();
    redrawCanvas();
  }

  /**
   * Экспортирует текущее состояние canvas как PNG Blob.
   */
  function exportToBlob(): Promise<Blob> {
    const canvas = canvasRef.value;

    if (!canvas) {
      return Promise.reject(new Error('Canvas не инициализирован'));
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Не удалось экспортировать canvas'));
        }
      }, 'image/png');
    });
  }

  const hasStrokes = computed(() => strokes.value.length > 0);

  onKeyStroke(['z', 'я'], (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      undo();
    }
  });

  onMounted(() => loadBackgroundImage());

  watch(
    () => props.screenshotUrl,
    () => {
      strokes.value = [];
      currentStroke.value = null;
      loadBackgroundImage();
    },
  );

  defineExpose({ exportToBlob, undo, hasStrokes });
</script>

<template>
  <div class="relative w-fit overflow-hidden">
    <canvas
      ref="canvasRef"
      class="block cursor-crosshair"
      :width="canvasWidth"
      :height="canvasHeight"
      @mousedown.left.prevent="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup.left="handleMouseUp"
      @mouseleave="handleMouseUp"
    />
  </div>
</template>

<style lang="scss" scoped>
  .cursor-crosshair {
    cursor: crosshair;
  }
</style>
