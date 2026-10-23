<script setup lang="ts">
  import type { TextSelection } from '../model';

  import { useBugReport } from '../composables';
  import {
    BUG_REPORT_ICON,
    BUG_REPORT_TEXT,
    getSelectionContext,
  } from '../model';

  /**
   * Кнопка «Ошибка в тексте» под выделенным текстом: открывает баг-репорт с
   * выделением и его окружением. В полях ввода не появляется.
   */
  const SELECTION_SETTLE_DELAY_MS = 300;
  const BUTTON_OFFSET_PX = 8;

  const { openReportWithSelection } = useBugReport();

  const isVisible = ref(false);
  const position = ref({ top: 0, left: 0 });

  // Клик по кнопке может сбросить выделение раньше, чем сработает click,
  // поэтому контекст запоминается при показе
  const captured = ref<TextSelection>();

  const buttonStyle = computed(() => ({
    top: `${position.value.top}px`,
    left: `${position.value.left}px`,
  }));

  /**
   * Выделение в поле ввода правят, а не читают.
   * @param selection - выделение
   */
  function isInEditableField(selection: Selection): boolean {
    const node = selection.anchorNode;
    const element = node instanceof Element ? node : node?.parentElement;

    return !!element?.closest(
      'input, textarea, [contenteditable]:not([contenteditable="false"])',
    );
  }

  /** Показывает кнопку под текущим выделением или прячет её. */
  function update(): void {
    const selection = window.getSelection();
    const selected = selection?.toString().trim() ?? '';

    if (
      !selection
      || selection.isCollapsed
      || !selected
      || isInEditableField(selection)
    ) {
      isVisible.value = false;

      return;
    }

    const range = selection.getRangeAt(0);
    const ancestor = range.commonAncestorContainer;

    const block =
      ancestor instanceof Element ? ancestor : ancestor.parentElement;

    const rect = range.getBoundingClientRect();

    captured.value = getSelectionContext(block?.textContent ?? '', selected);

    position.value = {
      top: rect.bottom + window.scrollY + BUTTON_OFFSET_PX,
      left: rect.left + window.scrollX + rect.width / 2,
    };

    isVisible.value = true;
  }

  // На телефоне mouseup при выделении нет, поэтому слушаем selectionchange
  // и ждём, пока жест выделения закончится
  const onSelectionChange = useDebounceFn(update, SELECTION_SETTLE_DELAY_MS);

  function report(): void {
    if (captured.value) {
      openReportWithSelection(captured.value);
    }

    window.getSelection()?.removeAllRanges();
    captured.value = undefined;
    isVisible.value = false;
  }

  useEventListener(document, 'selectionchange', onSelectionChange);
</script>

<template>
  <Teleport to="body">
    <UButton
      v-if="isVisible"
      :label="BUG_REPORT_TEXT.selectionButton"
      :icon="BUG_REPORT_ICON.bug"
      :style="buttonStyle"
      color="neutral"
      variant="outline"
      size="sm"
      class="absolute z-100 -translate-x-1/2 bg-elevated shadow-lg"
      @pointerdown.stop.prevent
      @click.left.exact.prevent="report"
    />
  </Teleport>
</template>
