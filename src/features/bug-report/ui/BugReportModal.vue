<script setup lang="ts">
  import { useEventListener } from '@vueuse/core';
  import { storeToRefs } from 'pinia';
  import { ref, computed, watch, onUnmounted } from 'vue';

  import { useUserStore } from '@/shared/stores/UserStore';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  import {
    DEFAULT_BRUSH_COLOR,
    DEFAULT_BRUSH_SIZE,
    BUG_REPORT_ANONYMOUS_USER,
  } from '@/features/bug-report/model';

  import { useBugReport } from '../composables/useBugReport';

  import BugReportCanvas from './BugReportCanvas.vue';
  import BugReportColorPicker from './BugReportColorPicker.vue';

  const {
    isModalOpen,
    capturedPageUrl,
    screenshot,
    textSelection,
    setScreenshot,
    clearScreenshot,
    clearTextSelection,
    cancel,
    submit,
  } = useBugReport();

  const userStore = useUserStore();
  const { user, isAuthenticated } = storeToRefs(userStore);

  const canvasRef = ref<InstanceType<typeof BugReportCanvas>>();

  const description = ref('');
  const brushColor = ref(DEFAULT_BRUSH_COLOR.value);
  const isSubmitting = ref(false);

  const screenshotUrl = ref('');

  const hasScreenshot = computed(() => Boolean(screenshotUrl.value));

  const authorName = computed(() =>
    isAuthenticated.value && user.value
      ? user.value.name || user.value.username
      : BUG_REPORT_ANONYMOUS_USER,
  );

  const authorIcon = computed(() =>
    isAuthenticated.value ? 'user-check' : 'user-question',
  );

  watch(
    screenshot,
    (newFile) => {
      if (screenshotUrl.value) {
        URL.revokeObjectURL(screenshotUrl.value);
        screenshotUrl.value = '';
      }

      if (newFile) {
        screenshotUrl.value = URL.createObjectURL(newFile);
      }
    },
    { immediate: true },
  );

  const isFormValid = computed(() => description.value.trim().length > 0);

  async function handleSubmit(): Promise<void> {
    if (!isFormValid.value) {
      return;
    }

    isSubmitting.value = true;

    try {
      const screenshotBlob = canvasRef.value
        ? await canvasRef.value.exportToBlob()
        : null;

      const success = await submit(description.value.trim(), screenshotBlob);

      if (success) {
        description.value = '';
      }
    } catch (err) {
      console.error(err);
    } finally {
      isSubmitting.value = false;
    }
  }

  function handleCancel(): void {
    description.value = '';
    cancel();
  }

  function handleUndo(): void {
    canvasRef.value?.undo();
  }

  function handleAfterLeave(): void {
    description.value = '';
    brushColor.value = DEFAULT_BRUSH_COLOR.value;
  }

  // Поддержка вставки скриншота из буфера обмена (Ctrl+V)
  useEventListener(
    'paste',
    (event: ClipboardEvent) => {
      if (!isModalOpen.value) {
        return;
      }

      const items = event.clipboardData?.items;

      if (!items) {
        return;
      }

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item && item.type.includes('image')) {
          const file = item.getAsFile();

          if (file) {
            setScreenshot(file);
            event.preventDefault();
            event.stopPropagation();

            break;
          }
        }
      }
    },
    { capture: true },
  );

  onUnmounted(() => {
    if (screenshotUrl.value) {
      URL.revokeObjectURL(screenshotUrl.value);
    }
  });
</script>

<template>
  <n-modal
    v-model:show="isModalOpen"
    :mask-closable="!isSubmitting"
    @after-leave="handleAfterLeave"
  >
    <div class="bug-report-modal">
      <!-- Шапка -->
      <div class="bug-report-modal__header">
        <div class="bug-report-modal__title-group">
          <svg-icon
            icon="bug"
            size="20"
            class="bug-report-modal__bug-icon"
          />

          <h2 class="bug-report-modal__title">Сообщить о баге</h2>
        </div>

        <n-button
          circle
          secondary
          :disabled="isSubmitting"
          @click="handleCancel"
        >
          <template #icon>
            <svg-icon icon="close" />
          </template>
        </n-button>
      </div>

      <!-- Тело -->
      <div class="bug-report-modal__body">
        <!-- Левая колонка: скриншот и рисование -->
        <div class="bug-report-modal__canvas-area">
          <div
            :class="[
              'bug-report-modal__canvas-wrapper',
              { 'is-empty': !hasScreenshot },
            ]"
          >
            <bug-report-canvas
              v-if="hasScreenshot"
              ref="canvasRef"
              :screenshot-url="screenshotUrl"
              :brush-color="brushColor"
              :brush-size="DEFAULT_BRUSH_SIZE"
            />

            <div
              v-else
              class="bug-report-modal__placeholder"
            >
              <svg-icon
                icon="photo-plus"
                size="40"
                class="bug-report-modal__placeholder-icon"
              />

              <div class="bug-report-modal__placeholder-title">
                Вставьте скриншот
              </div>

              <div class="bug-report-modal__placeholder-desc">
                Сделайте снимок экрана (<kbd>PrintScreen</kbd>

                ,
                <kbd>Win + Shift + S</kbd>

                или <kbd>Cmd + Shift + 4</kbd>

                ) и нажмите <kbd>Ctrl + V</kbd> в этом окне.
              </div>
            </div>
          </div>

          <!-- Инструменты рисования -->
          <div
            v-if="hasScreenshot"
            class="bug-report-modal__toolbar"
          >
            <bug-report-color-picker
              v-model="brushColor"
              vertical
            />

            <div class="bug-report-modal__toolbar-divider" />

            <n-button
              secondary
              circle
              size="small"
              title="Отменить действие (Ctrl+Z)"
              :disabled="!canvasRef?.hasStrokes"
              @click="handleUndo"
            >
              <template #icon>
                <svg-icon icon="arrow-back-up" />
              </template>
            </n-button>

            <div class="bug-report-modal__toolbar-divider" />

            <n-button
              type="error"
              secondary
              circle
              size="small"
              title="Удалить скриншот"
              @click="clearScreenshot"
            >
              <template #icon>
                <svg-icon icon="trash" />
              </template>
            </n-button>
          </div>
        </div>

        <!-- Правая колонка: форма -->
        <div class="bug-report-modal__form-area">
          <div class="bug-report-modal__meta">
            <!-- Автор -->
            <div class="bug-report-modal__meta-item">
              <svg-icon
                :icon="authorIcon"
                size="18"
                class="bug-report-modal__meta-icon"
              />

              <span>
                Автор: <strong>{{ authorName }}</strong>
              </span>
            </div>
            <!-- Страница -->
            <div class="bug-report-modal__meta-item is-link">
              <svg-icon
                icon="link"
                size="16"
                class="bug-report-modal__meta-icon"
              />

              <a
                :href="capturedPageUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="bug-report-modal__page-link"
              >
                {{ capturedPageUrl }}
              </a>
            </div>
          </div>

          <div class="bug-report-modal__divider-horizontal" />

          <!-- Контекст выделенного текста -->
          <div
            v-if="textSelection"
            class="bug-report-modal__selection-box"
          >
            <div class="bug-report-modal__selection-header">
              <div class="bug-report-modal__selection-title-group">
                <svg-icon
                  icon="text-scan"
                  size="16"
                  class="bug-report-modal__selection-icon"
                />

                <span class="bug-report-modal__selection-title"
                  >Выделенный текст</span
                >
              </div>

              <n-button
                quaternary
                circle
                size="tiny"
                title="Очистить выделение"
                @click="clearTextSelection"
              >
                <template #icon>
                  <svg-icon icon="close" />
                </template>
              </n-button>
            </div>

            <div class="bug-report-modal__selection-text">
              <span
                v-if="textSelection.before"
                class="is-context"
                >...{{ textSelection.before }}</span
              >

              <span class="is-highlighted">{{ textSelection.selected }}</span>

              <span
                v-if="textSelection.after"
                class="is-context"
                >{{ textSelection.after }}...</span
              >
            </div>
          </div>

          <div
            v-else
            class="bug-report-modal__helper-box"
          >
            <svg-icon
              icon="text-scan"
              size="16"
              class="bug-report-modal__helper-icon"
            />

            <span
              >Выделите опечатку на странице и нажмите «Ошибка в тексте», чтобы
              отправить контекст ошибки.</span
            >
          </div>

          <!-- Поле описания -->
          <div class="bug-report-modal__form-field">
            <label class="bug-report-modal__field-label">
              Описание проблемы <span class="is-required">*</span>
            </label>

            <n-input
              v-model:value="description"
              type="textarea"
              placeholder="Опишите, что произошло или как воспроизвести ошибку..."
              :rows="5"
              :disabled="isSubmitting"
              :maxlength="2000"
              show-count
            />
          </div>
        </div>
      </div>

      <!-- Подвал -->
      <div class="bug-report-modal__footer">
        <n-button
          secondary
          :disabled="isSubmitting"
          @click="handleCancel"
        >
          Отменить
        </n-button>

        <n-button
          type="primary"
          :loading="isSubmitting"
          :disabled="!isFormValid"
          @click="handleSubmit"
        >
          Отправить
        </n-button>
      </div>
    </div>
  </n-modal>
</template>

<style lang="scss" scoped>
  .bug-report-modal {
    overflow: hidden;
    display: flex;
    flex-direction: column;

    width: 95vw;
    max-width: 95vw;

    color: var(--text-color);

    background-color: var(--bg-secondary);
    border-radius: 12px;
    box-shadow: 0 12px 40px rgb(0 0 0 / 50%);

    @media (min-width: 900px) {
      width: fit-content;
      max-width: 90vw;
    }
  }

  .bug-report-modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 16px 24px;

    border-bottom: 1px solid var(--border);
  }

  .bug-report-modal__title-group {
    display: flex;
    gap: 8px;
    align-items: center;
    color: var(--text-color-title);
  }

  .bug-report-modal__bug-icon {
    color: var(--primary);
  }

  .bug-report-modal__title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.2;
  }

  .bug-report-modal__body {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;

    max-height: 70vh;
    padding: 24px;

    @media (min-width: 900px) {
      flex-direction: row;
    }
  }

  .bug-report-modal__canvas-area {
    display: none;

    @media (min-width: 900px) {
      display: flex;
      flex-shrink: 0;
      gap: 12px;
      width: auto;
    }
  }

  .bug-report-modal__canvas-wrapper {
    overflow: auto;
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;

    background-color: var(--bg-main);
    border: 1px solid var(--border);
    border-radius: 8px;

    &.is-empty {
      min-width: 320px;
      max-width: 480px;
      min-height: 300px;

      @media (min-width: 900px) {
        width: 380px;
        height: 380px;
      }
    }
  }

  .bug-report-modal__placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    padding: 24px;

    color: var(--text-color-mute);
    text-align: center;
  }

  .bug-report-modal__placeholder-icon {
    margin-bottom: 12px;
    opacity: 0.6;
  }

  .bug-report-modal__placeholder-title {
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 600;
  }

  .bug-report-modal__placeholder-desc {
    max-width: 280px;
    font-size: 12px;
    line-height: 1.5;

    kbd {
      padding: 2px 4px;

      font-size: 10px;

      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 4px;
    }
  }

  .bug-report-modal__toolbar {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;

    padding: 12px 8px;

    background: var(--bg-main);
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .bug-report-modal__toolbar-divider {
    width: 16px;
    height: 1px;
    background: var(--border);
  }

  .bug-report-modal__form-area {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 16px;

    min-width: 280px;

    @media (min-width: 900px) {
      min-width: 400px;
    }
  }

  .bug-report-modal__meta {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .bug-report-modal__meta-item {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 13px;

    &.is-link {
      word-break: break-all;
    }
  }

  .bug-report-modal__meta-icon {
    flex-shrink: 0;
    opacity: 0.7;
  }

  .bug-report-modal__page-link {
    color: var(--primary);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .bug-report-modal__divider-horizontal {
    height: 1px;
    background: var(--border);
  }

  .bug-report-modal__selection-box {
    display: flex;
    flex-direction: column;
    gap: 8px;

    padding: 12px;

    background: var(--bg-main);
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .bug-report-modal__selection-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .bug-report-modal__selection-title-group {
    display: flex;
    gap: 6px;
    align-items: center;
    color: var(--text-color-title);
  }

  .bug-report-modal__selection-icon {
    color: var(--primary);
  }

  .bug-report-modal__selection-title {
    font-size: 12px;
    font-weight: 600;
  }

  .bug-report-modal__selection-text {
    overflow-y: auto;

    max-height: 120px;
    padding-right: 4px;

    font-size: 12px;
    line-height: 1.6;
    word-break: break-word;
    white-space: pre-wrap;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: var(--border);
      border-radius: 2px;
    }

    .is-context {
      opacity: 0.6;
    }

    .is-highlighted {
      padding: 0 2px;

      font-weight: 600;
      color: var(--text-color-title);
      text-decoration: underline;
      text-decoration-color: var(--primary);
      text-underline-offset: 3px;
    }
  }

  .bug-report-modal__helper-box {
    display: flex;
    gap: 8px;
    align-items: flex-start;

    padding: 10px;

    font-size: 11px;
    line-height: 1.5;

    opacity: 0.7;
    background: var(--bg-main);
    border: 1px dashed var(--border);
    border-radius: 8px;
  }

  .bug-report-modal__helper-icon {
    flex-shrink: 0;
    margin-top: 1px;
  }

  .bug-report-modal__form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .bug-report-modal__field-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-color-title);

    .is-required {
      color: var(--primary);
    }
  }

  .bug-report-modal__footer {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: flex-end;

    padding: 16px 24px;

    background-color: var(--bg-main);
    border-top: 1px solid var(--border);
  }
</style>
