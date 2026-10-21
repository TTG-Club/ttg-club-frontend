<script setup lang="ts">
  import { useEventListener } from '@vueuse/core';
  import { ref } from 'vue';

  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  import { useBugReport } from '@/features/bug-report/composables/useBugReport';
  import type { TextSelection } from '@/features/bug-report/model';
  import { SELECTION_CONTEXT_LENGTH } from '@/features/bug-report/model';

  /**
   * Извлекает текстовый контекст вокруг выделения из DOM.
   */
  function extractTextContext(selection: Selection): TextSelection | null {
    const selectedText = selection.toString().trim();

    if (!selectedText) {
      return null;
    }

    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;

    // Получаем весь текст родительского контейнера
    const container =
      commonAncestor.nodeType === Node.TEXT_NODE
        ? commonAncestor.parentElement
        : commonAncestor;

    if (!container) {
      return null;
    }

    const fullText = container.textContent ?? '';
    const selectionStart = fullText.indexOf(selectedText);

    if (selectionStart === -1) {
      return {
        before: '',
        selected: selectedText,
        after: '',
      };
    }

    const beforeStart = Math.max(0, selectionStart - SELECTION_CONTEXT_LENGTH);

    const afterEnd = Math.min(
      fullText.length,
      selectionStart + selectedText.length + SELECTION_CONTEXT_LENGTH,
    );

    return {
      before: fullText.slice(beforeStart, selectionStart),
      selected: selectedText,
      after: fullText.slice(selectionStart + selectedText.length, afterEnd),
    };
  }

  const { openReportWithSelection } = useBugReport();

  const isVisible = ref(false);
  const buttonPosition = ref({ top: 0, left: 0 });

  /** Обработчик события отпускания мыши — показывает кнопку рядом с выделением */
  function handleMouseUp() {
    setTimeout(() => {
      const selection = window.getSelection();

      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      buttonPosition.value = {
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX + rect.width / 2,
      };

      isVisible.value = true;
    }, 10);
  }

  /** Скрывает кнопку при клике вне выделения */
  function handleMouseDown(event: MouseEvent) {
    if (!(event.target instanceof HTMLElement)) {
      return;
    }

    // Не скрываем если клик по самой кнопке
    if (event.target.closest('[data-selection-report-button]')) {
      return;
    }

    isVisible.value = false;
  }

  /** Обрабатывает клик по кнопке: собирает контекст и открывает модалку */
  function handleReportClick() {
    const selection = window.getSelection();

    if (!selection || selection.isCollapsed) {
      isVisible.value = false;

      return;
    }

    const textContext = extractTextContext(selection);

    if (textContext) {
      openReportWithSelection(textContext);
    }

    selection.removeAllRanges();
    isVisible.value = false;
  }

  useEventListener('mouseup', handleMouseUp);
  useEventListener('mousedown', handleMouseDown);
</script>

<template>
  <Teleport to="body">
    <Transition name="selection-button-fade">
      <button
        v-if="isVisible"
        data-selection-report-button
        type="button"
        class="selection-report-btn"
        :style="{
          top: `${buttonPosition.top}px`,
          left: `${buttonPosition.left}px`,
        }"
        @click.left.exact.prevent="handleReportClick"
      >
        <svg-icon
          icon="bug"
          class="selection-report-btn__icon"
        />

        <span>Ошибка в тексте</span>
      </button>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
  .selection-report-btn {
    cursor: pointer;

    position: absolute;
    z-index: 9999;
    transform: translateX(-50%);

    display: flex;
    gap: 6px;
    align-items: center;

    padding: 6px 12px;

    font-size: 12px;
    font-weight: 500;
    line-height: 1.5;
    color: var(--text-color-title);
    white-space: nowrap;

    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);

    transition: all 0.15s ease-in-out;

    &:hover {
      background-color: var(--bg-sub-menu);
      border-color: var(--primary);
    }
  }

  .selection-report-btn__icon {
    color: var(--primary);
  }

  .selection-button-fade-enter-active,
  .selection-button-fade-leave-active {
    transition: all 0.15s ease;
  }

  .selection-button-fade-enter-from,
  .selection-button-fade-leave-to {
    transform: translateX(-50%) translateY(-4px);
    opacity: 0;
  }
</style>
