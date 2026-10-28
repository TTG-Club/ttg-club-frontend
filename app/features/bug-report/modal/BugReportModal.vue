<script setup lang="ts">
  import type { BugReportType, DrawingTool } from '../model';

  import { useBugReport } from '../composables';
  import {
    BRUSH_SIZE,
    BUG_REPORT_DESCRIPTION_MAX_LENGTH,
    BUG_REPORT_ICON,
    BUG_REPORT_TEXT,
    BUG_REPORT_TYPE_TABS,
    BUG_REPORT_TYPE_TEXT,
    DEFAULT_BRUSH_COLOR,
    DEFAULT_BUG_REPORT_TYPE,
    DRAWING_TOOL_BUTTONS,
    isBugReportType,
  } from '../model';
  import {
    BugReportAuthor,
    BugReportCanvas,
    BugReportColorPicker,
    BugReportTextContext,
  } from './ui';

  /**
   * Окно баг-репорта или пожелания, как на new.ttg.club: вкладка типа,
   * описание, страница, выделенный текст и скриншот с пометками. Скриншот вставляется из буфера обмена или выбирается файлом.
   */
  const { isOpen, pageUrl, textSelection, clearTextSelection, close, submit } =
    useBugReport();

  const canvasRef =
    useTemplateRef<InstanceType<typeof BugReportCanvas>>('canvasRef');

  const fileInput = useTemplateRef<HTMLInputElement>('fileInput');

  const description = ref('');
  const brushColor = ref(DEFAULT_BRUSH_COLOR);
  const tool = ref<DrawingTool>('brush');
  const isSubmitting = ref(false);
  const screenshotUrl = ref('');

  /** Что отправляем: баг или пожелание. */
  const reportType = ref<BugReportType>(DEFAULT_BUG_REPORT_TYPE);

  const typeText = computed(() => BUG_REPORT_TYPE_TEXT[reportType.value]);

  /**
   * Переключает тип записи по вкладке.
   * @param value - значение вкладки
   */
  function onTypeChange(value: string | number): void {
    if (isBugReportType(value)) {
      reportType.value = value;
    }
  }

  const hasScreenshot = computed(() => !!screenshotUrl.value);

  const canUndo = computed<boolean>(() => !!canvasRef.value?.hasStrokes);

  const isValid = computed(() => !!description.value.trim());

  const toolButtons = computed(() =>
    DRAWING_TOOL_BUTTONS.map(
      (button) =>
        ({
          ...button,
          color: button.tool === tool.value ? 'primary' : 'neutral',
          variant: button.tool === tool.value ? 'solid' : 'ghost',
        }) as const,
    ),
  );

  const screenshotAreaClass = computed(() =>
    hasScreenshot.value ? '' : 'flex flex-col self-stretch',
  );

  const toolbarClass = computed(() =>
    hasScreenshot.value ? '' : 'pointer-events-none opacity-40',
  );

  /**
   * Ставит скриншот вместо прежнего.
   * @param file - картинка
   */
  function setScreenshot(file: Blob): void {
    if (screenshotUrl.value) {
      URL.revokeObjectURL(screenshotUrl.value);
    }

    screenshotUrl.value = URL.createObjectURL(file);
  }

  function removeScreenshot(): void {
    if (screenshotUrl.value) {
      URL.revokeObjectURL(screenshotUrl.value);
    }

    screenshotUrl.value = '';
  }

  function pickFile(): void {
    fileInput.value?.click();
  }

  /**
   * Берёт выбранный файл скриншота.
   * @param event - выбор файла
   */
  function onFileChange(event: Event): void {
    const input = event.target;

    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const file = input.files?.[0];

    if (file) {
      setScreenshot(file);
    }

    input.value = '';
  }

  /**
   * @param value - инструмент рисования
   */
  function selectTool(value: DrawingTool): void {
    tool.value = value;
  }

  function undo(): void {
    canvasRef.value?.undo();
  }

  /** Сбрасывает форму, когда окно закрыто. */
  function reset(): void {
    description.value = '';
    brushColor.value = DEFAULT_BRUSH_COLOR;
    tool.value = 'brush';
    removeScreenshot();
  }

  async function send(): Promise<void> {
    if (!isValid.value || isSubmitting.value) {
      return;
    }

    isSubmitting.value = true;

    try {
      const screenshot = (await canvasRef.value?.exportToBlob()) ?? null;

      await submit(description.value.trim(), screenshot, reportType.value);
    } finally {
      isSubmitting.value = false;
    }
  }

  /**
   * Ctrl или Cmd + Enter отправляет репорт из поля описания.
   * @param event - нажатие клавиши
   */
  function onDescriptionKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      void send();
    }
  }

  // Окно живёт между открытиями, поэтому каждое начинается с бага
  watch(isOpen, (opened) => {
    reportType.value = DEFAULT_BUG_REPORT_TYPE;

    if (!opened) {
      reset();
    }
  });

  // Картинку из буфера перехватываем до поля описания, иначе её не вставить
  useEventListener(
    'paste',
    (event: ClipboardEvent) => {
      if (!isOpen.value) {
        return;
      }

      const file = [...(event.clipboardData?.items ?? [])]
        .find((item) => item.type.startsWith('image/'))
        ?.getAsFile();

      if (!file) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setScreenshot(file);
    },
    { capture: true },
  );

  onScopeDispose(removeScreenshot);
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="typeText.title"
    class="sm:w-fit sm:max-w-[90vw]"
  >
    <template #body>
      <div class="flex flex-col gap-4 lg:flex-row">
        <!-- Скриншот на телефоне не нужен: снимок экрана там не вставить -->
        <div class="hidden shrink-0 gap-2 lg:flex">
          <div
            :class="screenshotAreaClass"
            class="max-h-[70vh] min-w-75 overflow-auto rounded-lg border border-default"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onFileChange"
            />

            <BugReportCanvas
              v-if="hasScreenshot"
              ref="canvasRef"
              :screenshot-url="screenshotUrl"
              :brush-color="brushColor"
              :brush-size="BRUSH_SIZE"
              :tool="tool"
            />

            <button
              v-else
              type="button"
              class="flex min-h-100 w-75 flex-1 cursor-pointer flex-col items-center justify-center gap-2 bg-elevated p-4 text-center text-muted transition-colors hover:bg-accented/50"
              @click.left.exact.prevent="pickFile"
            >
              <UIcon
                :name="BUG_REPORT_ICON.screenshot"
                class="size-10"
              />

              <span class="text-sm font-medium text-highlighted">
                {{ BUG_REPORT_TEXT.screenshot }}
              </span>

              <span class="text-xs">{{ BUG_REPORT_TEXT.screenshotHint }}</span>

              <span class="text-xs">{{ BUG_REPORT_TEXT.screenshotFile }}</span>
            </button>
          </div>

          <div
            :class="toolbarClass"
            class="flex flex-col items-center gap-2 rounded-lg border border-default bg-elevated p-2"
          >
            <BugReportColorPicker
              v-model="brushColor"
              :disabled="!hasScreenshot"
            />

            <USeparator />

            <UTooltip
              v-for="button in toolButtons"
              :key="button.tool"
              :text="button.label"
            >
              <UButton
                :icon="button.icon"
                :aria-label="button.label"
                :color="button.color"
                :variant="button.variant"
                :disabled="!hasScreenshot"
                size="sm"
                @click.left.exact.prevent="selectTool(button.tool)"
              />
            </UTooltip>

            <USeparator />

            <UTooltip :text="BUG_REPORT_TEXT.undo">
              <UButton
                :icon="BUG_REPORT_ICON.undo"
                :aria-label="BUG_REPORT_TEXT.undo"
                :disabled="!canUndo"
                color="neutral"
                variant="ghost"
                size="sm"
                @click.left.exact.prevent="undo"
              />
            </UTooltip>

            <USeparator class="mt-auto" />

            <UTooltip :text="BUG_REPORT_TEXT.removeScreenshot">
              <UButton
                :icon="BUG_REPORT_ICON.remove"
                :aria-label="BUG_REPORT_TEXT.removeScreenshot"
                :disabled="!hasScreenshot"
                color="error"
                variant="ghost"
                size="sm"
                @click.left.exact.prevent="removeScreenshot"
              />
            </UTooltip>
          </div>
        </div>

        <div class="flex w-full shrink-0 flex-col gap-4 lg:w-100">
          <UTabs
            :model-value="reportType"
            :items="BUG_REPORT_TYPE_TABS"
            :content="false"
            size="sm"
            class="w-full"
            @update:model-value="onTypeChange"
          />

          <div class="flex flex-col gap-3">
            <BugReportAuthor />

            <p class="flex items-center gap-2 text-xs text-muted">
              <UIcon
                :name="BUG_REPORT_ICON.page"
                class="size-4 shrink-0"
              />

              <span class="break-all">
                {{ BUG_REPORT_TEXT.page }}: {{ pageUrl }}
              </span>
            </p>
          </div>

          <USeparator />

          <BugReportTextContext
            v-if="textSelection"
            :selection="textSelection"
            @clear="clearTextSelection"
          />

          <p
            v-else
            class="flex items-center gap-1.5 rounded-lg border border-dashed border-default bg-elevated px-3 py-2 text-xs text-muted"
          >
            <UIcon
              :name="BUG_REPORT_ICON.selection"
              class="size-4 shrink-0"
            />

            {{ BUG_REPORT_TEXT.selectionHint }}
          </p>

          <UFormField
            :label="typeText.description"
            :help="BUG_REPORT_TEXT.submitHint"
            required
          >
            <UTextarea
              v-model="description"
              :placeholder="typeText.descriptionPlaceholder"
              :maxlength="BUG_REPORT_DESCRIPTION_MAX_LENGTH"
              :rows="6"
              autoresize
              class="w-full"
              @keydown="onDescriptionKeydown"
            />
          </UFormField>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="BUG_REPORT_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="close"
        />

        <UButton
          :label="BUG_REPORT_TEXT.submit"
          :loading="isSubmitting"
          :disabled="!isValid"
          @click.left.exact.prevent="send"
        />
      </div>
    </template>
  </UModal>
</template>
