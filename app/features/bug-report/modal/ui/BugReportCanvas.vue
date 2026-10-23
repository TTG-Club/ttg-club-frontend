<script setup lang="ts">
  import type { CanvasPoint, DrawingTool, Stroke } from '../../model';

  import {
    CANVAS_MIN_SIZE,
    fitImageSize,
    MAX_SCREENSHOT_EXPORT_SIZE,
    MAX_UNDO_STEPS,
    MODAL_CHROME_WIDTH,
    MODAL_MAX_WIDTH_RATIO,
    SCREENSHOT_EXPORT_MIME,
    SCREENSHOT_EXPORT_QUALITY,
    SCREENSHOT_MAX_HEIGHT_RATIO,
  } from '../../model';

  /**
   * Скриншот, на котором можно сделать пометки кистью, кругом или
   * прямоугольником. Холст хранит картинку в исходном разрешении, на экране
   * она вписана в окно.
   */
  const { screenshotUrl, brushColor, brushSize, tool } = defineProps<{
    screenshotUrl: string;
    brushColor: string;
    brushSize: number;
    tool: DrawingTool;
  }>();

  const canvas = useTemplateRef<HTMLCanvasElement>('canvas');

  const image = shallowRef<HTMLImageElement>();

  const strokes = ref<Stroke[]>([]);
  const currentStroke = ref<Stroke>();

  /** Размер холста на экране. */
  const display = ref({ width: 0, height: 0 });

  /** Размер и место картинки на холсте: маленькая стоит по центру. */
  const imageBox = ref({ x: 0, y: 0, width: 0, height: 0 });

  /** Сколько пикселей оригинала приходится на пиксель экрана. */
  const pixelScale = ref(1);

  const bufferWidth = computed(() =>
    Math.round(display.value.width * pixelScale.value),
  );

  const bufferHeight = computed(() =>
    Math.round(display.value.height * pixelScale.value),
  );

  const canvasStyle = computed(() => ({
    width: `${display.value.width}px`,
    height: `${display.value.height}px`,
  }));

  const hasStrokes = computed(() => strokes.value.length > 0);

  /**
   * Рисует одну пометку.
   * @param context - контекст холста
   * @param stroke - пометка
   */
  function drawStroke(context: CanvasRenderingContext2D, stroke: Stroke): void {
    const first = stroke.points[0];
    const last = stroke.points.at(-1);

    if (!first || !last || stroke.points.length < 2) {
      return;
    }

    context.beginPath();
    context.strokeStyle = stroke.color;
    context.lineWidth = stroke.size;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    if (stroke.tool === 'rectangle') {
      context.strokeRect(first.x, first.y, last.x - first.x, last.y - first.y);

      return;
    }

    if (stroke.tool === 'circle') {
      context.arc(
        first.x,
        first.y,
        Math.hypot(last.x - first.x, last.y - first.y),
        0,
        2 * Math.PI,
      );

      context.stroke();

      return;
    }

    context.moveTo(first.x, first.y);

    for (const point of stroke.points.slice(1)) {
      context.lineTo(point.x, point.y);
    }

    context.stroke();
  }

  /** Перерисовывает картинку и все пометки. */
  function redraw(): void {
    const element = canvas.value;
    const context = element?.getContext('2d');

    if (!element || !context || !image.value) {
      return;
    }

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, element.width, element.height);

    // Дальше рисуем в экранных координатах, масштаб до буфера берёт контекст
    context.setTransform(pixelScale.value, 0, 0, pixelScale.value, 0, 0);

    const box = imageBox.value;

    context.drawImage(image.value, box.x, box.y, box.width, box.height);

    for (const stroke of strokes.value) {
      drawStroke(context, stroke);
    }

    if (currentStroke.value) {
      drawStroke(context, currentStroke.value);
    }
  }

  /**
   * Подгоняет холст под загруженную картинку.
   * @param loaded - картинка скриншота
   */
  function layout(loaded: HTMLImageElement): void {
    const natural = {
      width: loaded.naturalWidth,
      height: loaded.naturalHeight,
    };

    const fitted = fitImageSize(natural, {
      width: Math.floor(
        window.innerWidth * MODAL_MAX_WIDTH_RATIO - MODAL_CHROME_WIDTH,
      ),
      height: Math.floor(window.innerHeight * SCREENSHOT_MAX_HEIGHT_RATIO),
    });

    const width = Math.max(fitted.width, CANVAS_MIN_SIZE.width);
    const height = Math.max(fitted.height, CANVAS_MIN_SIZE.height);

    const longestSide = Math.max(natural.width, natural.height);
    const exportLimit = Math.min(1, MAX_SCREENSHOT_EXPORT_SIZE / longestSide);

    display.value = { width, height };

    imageBox.value = {
      x: Math.floor((width - fitted.width) / 2),
      y: Math.floor((height - fitted.height) / 2),
      width: fitted.width,
      height: fitted.height,
    };

    pixelScale.value = fitted.width
      ? Math.max(1, (natural.width * exportLimit) / fitted.width)
      : 1;

    image.value = loaded;
  }

  /** Загружает скриншот и сбрасывает пометки. */
  function load(): void {
    const loaded = new Image();

    loaded.addEventListener('load', () => {
      strokes.value = [];
      currentStroke.value = undefined;
      layout(loaded);
      nextTick(redraw);
    });

    loaded.src = screenshotUrl;
  }

  /**
   * Точка под курсором в координатах холста.
   * @param event - событие указателя
   */
  function getPoint(event: PointerEvent): CanvasPoint {
    const rect = canvas.value?.getBoundingClientRect();

    return {
      x: event.clientX - (rect?.left ?? 0),
      y: event.clientY - (rect?.top ?? 0),
    };
  }

  /**
   * Начинает пометку.
   * @param event - нажатие
   */
  function start(event: PointerEvent): void {
    canvas.value?.setPointerCapture(event.pointerId);

    currentStroke.value = {
      color: brushColor,
      size: brushSize,
      tool,
      points: [getPoint(event)],
    };
  }

  /**
   * Продолжает пометку: кисть копит точки, у фигур меняется второй угол.
   * @param event - движение
   */
  function move(event: PointerEvent): void {
    const stroke = currentStroke.value;
    const first = stroke?.points[0];

    if (!stroke || !first) {
      return;
    }

    const point = getPoint(event);

    stroke.points =
      stroke.tool === 'brush' ? [...stroke.points, point] : [first, point];

    redraw();
  }

  /** Заканчивает пометку. */
  function finish(): void {
    const stroke = currentStroke.value;

    if (!stroke) {
      return;
    }

    if (stroke.points.length >= 2) {
      strokes.value = [...strokes.value, stroke].slice(-MAX_UNDO_STEPS);
    }

    currentStroke.value = undefined;
    redraw();
  }

  /** Отменяет последнюю пометку. */
  function undo(): void {
    strokes.value = strokes.value.slice(0, -1);
    redraw();
  }

  /** Скриншот с пометками в исходном разрешении. */
  function exportToBlob(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!canvas.value) {
        resolve(null);

        return;
      }

      canvas.value.toBlob(
        resolve,
        SCREENSHOT_EXPORT_MIME,
        SCREENSHOT_EXPORT_QUALITY,
      );
    });
  }

  onKeyStroke(['z', 'я'], (event) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      undo();
    }
  });

  watch(() => screenshotUrl, load, { immediate: true });

  defineExpose({ exportToBlob, undo, hasStrokes });
</script>

<template>
  <canvas
    ref="canvas"
    :width="bufferWidth"
    :height="bufferHeight"
    :style="canvasStyle"
    class="block cursor-crosshair touch-none bg-elevated"
    @pointerdown.left.prevent="start"
    @pointermove="move"
    @pointerup="finish"
    @pointercancel="finish"
  />
</template>
