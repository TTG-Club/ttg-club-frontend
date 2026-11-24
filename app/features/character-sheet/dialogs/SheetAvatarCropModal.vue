<script setup lang="ts">
  import { useAvatarCrop } from '../composables';
  import {
    CROP_HANDLES,
    SHEET_AVATAR_CROP,
    SHEET_AVATAR_ICON,
    SHEET_AVATAR_TEXT,
  } from '../model';

  /**
   * Выбор квадратной области портрета: рамка перетаскивается и тянется за
   * уголки, размер меняется ползунком и колесом, стрелки сдвигают рамку.
   * Закрывается файлом с вырезанным квадратом или ничем, если отменили.
   */
  const { file } = defineProps<{
    /** Файл, выбранный пользователем. */
    file: File;
  }>();

  const emit = defineEmits<{
    close: [file?: File];
  }>();

  const toast = useToast();

  // Ссылку на файл useObjectUrl отзовёт сам, когда окно закроется
  const sourceUrl = useObjectUrl(() => file);

  const imageRef = useTemplateRef<HTMLImageElement>('imageRef');

  const {
    area,
    areaRatio,
    naturalSize,
    cropSize,
    minSize,
    maxSize,
    isReady,
    initialize,
    startMove,
    startResize,
    moveArea,
    growArea,
    shrinkArea,
    crop,
  } = useAvatarCrop(imageRef);

  /** Файл не открылся: вырезать нечего. */
  const isBroken = ref(false);
  const isApplying = ref(false);

  const isApplyDisabled = computed(() => !isReady.value || isBroken.value);

  /** Короткая сторона не больше минимальной области: размер не меняется. */
  const isSizeLocked = computed(() => maxSize.value <= minSize.value);

  const areaStyle = computed(() => ({
    left: `${areaRatio.value.left}%`,
    top: `${areaRatio.value.top}%`,
    width: `${areaRatio.value.width}%`,
    height: `${areaRatio.value.height}%`,
  }));

  /** Затемнение вокруг рамки — четыре полосы по её сторонам, в долях картинки. */
  const dimmingStrips = computed(() => {
    const { left, top, width, height } = areaRatio.value;

    return [
      {
        key: 'top',
        style: { left: '0', top: '0', width: '100%', height: `${top}%` },
      },
      {
        key: 'bottom',
        style: {
          left: '0',
          top: `${top + height}%`,
          width: '100%',
          bottom: '0',
        },
      },
      {
        key: 'left',
        style: {
          left: '0',
          top: `${top}%`,
          width: `${left}%`,
          height: `${height}%`,
        },
      },
      {
        key: 'right',
        style: {
          left: `${left + width}%`,
          top: `${top}%`,
          right: '0',
          height: `${height}%`,
        },
      },
    ];
  });

  /** Предпросмотр: выбранная область, вписанная в круг размером с портрет. */
  const previewStyle = computed(() => {
    const side = SHEET_AVATAR_CROP.previewSize;
    const size = { width: `${side}px`, height: `${side}px` };
    const image = naturalSize.value;

    if (!image || !area.value.size || !sourceUrl.value) {
      return size;
    }

    const scale = side / area.value.size;

    return {
      ...size,
      backgroundImage: `url("${sourceUrl.value}")`,
      backgroundSize: `${image.width * scale}px ${image.height * scale}px`,
      backgroundPosition: `${-area.value.x * scale}px ${-area.value.y * scale}px`,
    };
  });

  function handleImageLoad(): void {
    isBroken.value = false;
    initialize();
  }

  function handleImageError(): void {
    isBroken.value = true;
  }

  /**
   * Колесо: от себя — область меньше (кадр крупнее), к себе — больше.
   * @param event - прокрутка над картинкой
   */
  function handleWheel(event: WheelEvent): void {
    if (event.deltaY < 0) {
      shrinkArea();

      return;
    }

    growArea();
  }

  async function apply(): Promise<void> {
    isApplying.value = true;

    try {
      const cropped = await crop(file.name);

      if (cropped) {
        emit('close', cropped);
      }
    } catch {
      toast.add({ color: 'error', title: SHEET_AVATAR_TEXT.cropError });
    } finally {
      isApplying.value = false;
    }
  }
</script>

<template>
  <UModal
    :title="SHEET_AVATAR_TEXT.cropTitle"
    :description="SHEET_AVATAR_TEXT.cropDescription"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UAlert
          v-if="isBroken"
          :icon="SHEET_AVATAR_ICON.broken"
          color="error"
          variant="subtle"
          :title="SHEET_AVATAR_TEXT.loadError"
          :description="SHEET_AVATAR_TEXT.loadErrorDescription"
        />

        <!-- touch-none висит на рамке, а не здесь: свайп по картинке
          прокручивает окно на узких экранах -->
        <div
          class="relative mx-auto w-fit bg-elevated select-none"
          @wheel.prevent="handleWheel"
        >
          <img
            ref="imageRef"
            :src="sourceUrl"
            :alt="SHEET_AVATAR_TEXT.imageAlt"
            draggable="false"
            class="block max-h-[45vh] max-w-full sm:max-h-[55vh]"
            @load="handleImageLoad"
            @error="handleImageError"
          />

          <template v-if="isReady">
            <div
              v-for="strip in dimmingStrips"
              :key="strip.key"
              class="pointer-events-none absolute bg-elevated/80"
              :style="strip.style"
            />

            <div
              class="absolute cursor-move touch-none border-2 border-primary outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
              tabindex="0"
              :aria-label="SHEET_AVATAR_TEXT.frame"
              :style="areaStyle"
              @pointerdown="startMove"
              @keydown.left.prevent="moveArea('left')"
              @keydown.right.prevent="moveArea('right')"
              @keydown.up.prevent="moveArea('up')"
              @keydown.down.prevent="moveArea('down')"
            >
              <!-- Уголки — для мыши и касаний; с клавиатуры размер меняет ползунок -->
              <span
                v-for="handle in CROP_HANDLES"
                :key="handle.corner"
                aria-hidden="true"
                class="absolute size-5 rounded-full border-2 border-primary bg-default"
                :class="handle.class"
                @pointerdown.stop="startResize($event, handle.corner)"
              />
            </div>
          </template>
        </div>

        <div
          v-if="isReady"
          class="flex items-center gap-4"
        >
          <div class="flex shrink-0 flex-col items-center gap-1">
            <!-- Обводка, а не рамка: рамка съедает место внутри круга -->
            <div
              class="rounded-full bg-elevated bg-no-repeat ring-2 ring-default"
              :style="previewStyle"
            />

            <span class="text-xs text-muted">
              {{ SHEET_AVATAR_TEXT.preview }}
            </span>
          </div>

          <UFormField
            v-if="!isSizeLocked"
            :label="SHEET_AVATAR_TEXT.size"
            class="grow"
          >
            <div class="flex items-center gap-3">
              <UTooltip :text="SHEET_AVATAR_TEXT.shrink">
                <UButton
                  :icon="SHEET_AVATAR_ICON.shrink"
                  color="neutral"
                  variant="subtle"
                  square
                  :aria-label="SHEET_AVATAR_TEXT.shrink"
                  @click.left.exact.prevent="shrinkArea"
                />
              </UTooltip>

              <USlider
                v-model="cropSize"
                :min="minSize"
                :max="maxSize"
                :aria-label="SHEET_AVATAR_TEXT.size"
                class="grow"
              />

              <UTooltip :text="SHEET_AVATAR_TEXT.grow">
                <UButton
                  :icon="SHEET_AVATAR_ICON.grow"
                  color="neutral"
                  variant="subtle"
                  square
                  :aria-label="SHEET_AVATAR_TEXT.grow"
                  @click.left.exact.prevent="growArea"
                />
              </UTooltip>
            </div>
          </UFormField>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="SHEET_AVATAR_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="emit('close')"
        />

        <UButton
          :label="SHEET_AVATAR_TEXT.apply"
          :icon="SHEET_AVATAR_ICON.apply"
          :loading="isApplying"
          :disabled="isApplyDisabled"
          @click.left.exact.prevent="apply"
        />
      </div>
    </template>
  </UModal>
</template>
