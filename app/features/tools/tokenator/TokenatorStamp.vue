<script setup lang="ts">
  import type { TokenOffset } from './model';

  import { useTokenator } from './composables';
  import {
    getPointsDistance,
    TOKEN_CLIP_RADIUS,
    TOKEN_IMAGE,
    TOKEN_MIRROR,
    TOKEN_SCALE,
    TOKEN_SIZE,
    TOKENATOR_TEXT,
  } from './model';

  /**
   * Токен: фон, картинка в круге и рамка. Картинку двигают мышью или пальцем,
   * масштабируют колесом с Ctrl или ⌘ и щипком, файл можно бросить сверху.
   */
  const {
    token,
    image,
    background,
    border,
    hasImage,
    scale,
    offset,
    isMirrored,
    setScale,
    loadFile,
    open,
  } = useTokenator();

  const stamp = useTemplateRef<SVGSVGElement>('stamp');

  const frame = useTemplateRef<HTMLDivElement>('frame');

  const clipId = useId();

  const viewBox = `0 0 ${TOKEN_SIZE} ${TOKEN_SIZE}`;
  const middle = TOKEN_SIZE / 2;
  const clipPath = `url(#${clipId})`;

  /** Активные касания: одно двигает картинку, два масштабируют. */
  const pointers = new Map<number, TokenOffset>();

  let pinchDistance: number | undefined;

  const isDragging = ref(false);

  const { isOverDropZone } = useDropZone(frame, {
    onDrop: (files) => loadFile(files?.[0]),
  });

  const imageSize = computed(() => TOKEN_SIZE * scale.value);

  const backgroundHref = computed(
    () => background.value || TOKEN_IMAGE.background,
  );

  const borderHref = computed(() => border.value || TOKEN_IMAGE.border);

  const imageX = computed(() => (isMirrored.value ? TOKEN_MIRROR.x : 0));

  const imageTransform = computed(() =>
    isMirrored.value ? TOKEN_MIRROR.transform : undefined,
  );

  const stampClass = computed(() => {
    if (!hasImage.value) {
      return 'cursor-pointer';
    }

    return isDragging.value ? 'cursor-grabbing' : 'cursor-grab';
  });

  const dropClass = computed(() =>
    isOverDropZone.value ? 'ring-4 ring-primary' : undefined,
  );

  watch(
    stamp,
    (element) => {
      token.value = element ?? undefined;
    },
    { immediate: true },
  );

  /** Сколько единиц SVG в одном пикселе экрана. */
  function getUnitsPerPixel(): number {
    const width = stamp.value?.getBoundingClientRect().width;

    return width ? TOKEN_SIZE / width : 1;
  }

  /** Без картинки клик по токену открывает выбор файла. */
  function pickImage(): void {
    if (!hasImage.value) {
      open();
    }
  }

  /**
   * Запоминает касание или нажатие на картинке.
   * @param event - событие указателя
   */
  function startPointer(event: PointerEvent): void {
    if (!hasImage.value) {
      return;
    }

    stamp.value?.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    isDragging.value = true;
  }

  /**
   * Двигает картинку одним указателем или масштабирует двумя.
   * @param event - событие указателя
   */
  function movePointer(event: PointerEvent): void {
    const previous = pointers.get(event.pointerId);

    if (!previous) {
      return;
    }

    const current = { x: event.clientX, y: event.clientY };

    pointers.set(event.pointerId, current);

    const [first, second] = pointers.values();

    if (first && second) {
      const distance = getPointsDistance(first, second);

      if (pinchDistance) {
        setScale((scale.value * distance) / pinchDistance);
      }

      pinchDistance = distance;

      return;
    }

    const ratio = getUnitsPerPixel();

    offset.value = {
      x: offset.value.x + (current.x - previous.x) * ratio,
      y: offset.value.y + (current.y - previous.y) * ratio,
    };
  }

  /**
   * Отпускает касание или нажатие.
   * @param event - событие указателя
   */
  function endPointer(event: PointerEvent): void {
    pointers.delete(event.pointerId);
    pinchDistance = undefined;
    isDragging.value = pointers.size > 0;
  }

  // Колесо с Ctrl или ⌘ (и щипок на тачпаде) масштабирует, без них — листает
  useEventListener(
    stamp,
    'wheel',
    (event: WheelEvent) => {
      if (!hasImage.value || !(event.ctrlKey || event.metaKey)) {
        return;
      }

      event.preventDefault();
      setScale(scale.value - event.deltaY * TOKEN_SCALE.wheel);
    },
    { passive: false },
  );
</script>

<template>
  <div
    ref="frame"
    class="relative aspect-square w-full max-w-md"
  >
    <svg
      ref="stamp"
      xmlns="http://www.w3.org/2000/svg"
      :viewBox="viewBox"
      class="size-full touch-none rounded-full select-none"
      :class="[stampClass, dropClass]"
      @click.left.exact.prevent="pickImage"
      @pointerdown="startPointer"
      @pointermove="movePointer"
      @pointerup="endPointer"
      @pointercancel="endPointer"
    >
      <clipPath :id="clipId">
        <circle
          :cx="middle"
          :cy="middle"
          :r="TOKEN_CLIP_RADIUS"
        />
      </clipPath>

      <g :clip-path="clipPath">
        <image
          :href="backgroundHref"
          :width="TOKEN_SIZE"
          :height="TOKEN_SIZE"
        />

        <svg
          v-if="hasImage"
          :x="offset.x"
          :y="offset.y"
          :width="imageSize"
          :height="imageSize"
        >
          <image
            width="100%"
            height="100%"
            :x="imageX"
            :href="image"
            :transform="imageTransform"
          />
        </svg>
      </g>

      <image
        :href="borderHref"
        :width="TOKEN_SIZE"
        :height="TOKEN_SIZE"
      />
    </svg>

    <p
      v-if="!hasImage"
      class="pointer-events-none absolute inset-[25%] flex items-center justify-center text-center text-muted"
    >
      {{ TOKENATOR_TEXT.drop }}
    </p>
  </div>
</template>
