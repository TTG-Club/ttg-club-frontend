<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type {
    DiceToken,
    HtmlEditorCommand,
    HtmlEditorMode,
    HtmlProblem,
  } from '../model';

  import {
    compressHtml,
    createDiceToken,
    createTokenElement,
    DICE_DEFAULT_LABEL,
    DICE_TOKEN_CLASS,
    editableToHtml,
    extractFormula,
    findHtmlProblems,
    fixHtmlProblems,
    HTML_EDITOR_ALIGN_COMMANDS,
    HTML_EDITOR_BLOCKS,
    HTML_EDITOR_ICON,
    HTML_EDITOR_INLINE_COMMANDS,
    HTML_EDITOR_LIST_COMMANDS,
    HTML_EDITOR_MODE_VARIANT,
    HTML_EDITOR_MODES,
    HTML_EDITOR_ROW_HEIGHT,
    HTML_EDITOR_TEXT,
    htmlToEditable,
    tokenFromElement,
  } from '../model';
  import HtmlEditorDiceModal from './HtmlEditorDiceModal.vue';
  import HtmlEditorProblems from './HtmlEditorProblems.vue';

  /**
   * HTML-редактор описаний: визуальный режим с броском кубиков и режим
   * исходного кода. Ошибки разметки, из-за которых бэкенд отклонит текст,
   * показываются над полем.
   */
  const {
    rows = 18,
    placeholder = HTML_EDITOR_TEXT.placeholder,
    disabled = false,
  } = defineProps<{
    rows?: number;
    placeholder?: string;
    disabled?: boolean;
  }>();

  const model = defineModel<string>({ required: true });

  const mode = ref<HtmlEditorMode>('html');
  const editor = useTemplateRef<HTMLElement>('editor');
  const source = useTemplateRef<HTMLTextAreaElement>('source');

  /**
   * Последняя отданная наружу разметка: в ответ на собственное обновление
   * модели визуальный режим не переписывается, иначе каретка прыгала бы в
   * начало на каждое нажатие.
   */
  const emitted = ref<string>();

  /**
   * Последнее выделение внутри редактора: меню заголовков и окно броска
   * забирают фокус, и команды восстанавливают выделение из него.
   */
  const lastRange = shallowRef<Range>();

  const isDiceOpen = ref(false);
  const isDiceExtended = ref(false);
  const diceToken = ref<DiceToken>(createDiceToken());
  const editingToken = shallowRef<HTMLElement>();
  const insertRange = shallowRef<Range>();

  const isVisual = computed(() => mode.value === 'html');
  const isToolbarDisabled = computed(() => disabled || !isVisual.value);
  const problems = computed(() => findHtmlProblems(model.value));

  const contentStyle = computed(() => ({
    minHeight: `${rows * HTML_EDITOR_ROW_HEIGHT}px`,
  }));

  const wrapperClass = computed(() =>
    problems.value.length ? 'border-error' : 'border-default',
  );

  const blockItems = computed<Array<DropdownMenuItem>>(() =>
    HTML_EDITOR_BLOCKS.map((block) => ({
      label: block.label,
      onSelect: () => formatBlock(block.tag),
    })),
  );

  const modeItems = computed(() =>
    HTML_EDITOR_MODES.map((option) => ({
      ...option,
      variant:
        option.value === mode.value
          ? HTML_EDITOR_MODE_VARIANT.active
          : HTML_EDITOR_MODE_VARIANT.inactive,
    })),
  );

  function syncFromModel(): void {
    if (editor.value) {
      editor.value.innerHTML = htmlToEditable(model.value);
    }
  }

  function emitValue(value: string): void {
    emitted.value = value;
    model.value = value;
  }

  function emitFromEditor(): void {
    if (editor.value) {
      emitValue(editableToHtml(editor.value.innerHTML));
    }
  }

  function handleSourceInput(event: Event): void {
    if (event.target instanceof HTMLTextAreaElement) {
      emitValue(event.target.value);
    }
  }

  // Сжимается не на каждый символ, а когда правка закончена: иначе
  // разметку нельзя было бы форматировать при наборе
  function handleSourceChange(event: Event): void {
    if (event.target instanceof HTMLTextAreaElement) {
      emitValue(compressHtml(event.target.value));
    }
  }

  function getEditorRange(): Range | undefined {
    const selection = window.getSelection();

    if (!selection?.rangeCount) {
      return undefined;
    }

    const range = selection.getRangeAt(0);

    return editor.value?.contains(range.commonAncestorContainer)
      ? range
      : undefined;
  }

  function rememberRange(): void {
    const range = getEditorRange();

    if (range) {
      lastRange.value = range.cloneRange();
    }
  }

  function restoreRange(): void {
    const range = lastRange.value;

    if (!range) {
      return;
    }

    const selection = window.getSelection();

    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  function findToken(range: Range | undefined): HTMLElement | undefined {
    const node = range?.startContainer;
    const element = node instanceof Element ? node : node?.parentElement;
    const token = element?.closest(`.${DICE_TOKEN_CLASS}`);

    return token instanceof HTMLElement ? token : undefined;
  }

  /**
   * Выполняет команду над выделением.
   * @param command - команда `execCommand`
   * @param value - её значение
   * @param isStyled - писать оформление в `style`
   */
  function runCommand(command: string, value?: string, isStyled = false): void {
    if (isToolbarDisabled.value) {
      return;
    }

    editor.value?.focus();
    restoreRange();

    if (isStyled) {
      document.execCommand('styleWithCSS', false, 'true');
    }

    document.execCommand(command, false, value);

    if (isStyled) {
      document.execCommand('styleWithCSS', false, 'false');
    }

    rememberRange();
    emitFromEditor();
  }

  function applyCommand(item: HtmlEditorCommand): void {
    runCommand(item.command, undefined, item.isStyled);
  }

  function formatBlock(tag: string): void {
    runCommand('formatBlock', tag);
  }

  function openDice(isExtended: boolean, token?: HTMLElement): void {
    if (isToolbarDisabled.value) {
      return;
    }

    const range = getEditorRange() ?? lastRange.value;
    const target = token ?? findToken(range);

    editingToken.value = target;
    insertRange.value = target ? undefined : range;

    if (target) {
      const current = tokenFromElement(target);

      diceToken.value = current;

      isDiceExtended.value =
        isExtended || current.variant !== 'dice' || !!current.label;
    } else {
      const selected = range?.toString().trim() ?? '';

      diceToken.value = createDiceToken({
        formula: extractFormula(selected),
        text: selected,
        label: isExtended ? DICE_DEFAULT_LABEL : '',
      });

      isDiceExtended.value = isExtended;
    }

    isDiceOpen.value = true;
  }

  function insertElement(element: HTMLElement): void {
    const range = insertRange.value;

    if (!range) {
      editor.value?.append(element);

      return;
    }

    range.deleteContents();
    range.insertNode(element);
    range.setStartAfter(element);
    range.collapse(true);

    const selection = window.getSelection();

    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  function applyDice(token: DiceToken): void {
    const element = createTokenElement(token);

    if (editingToken.value) {
      editingToken.value.replaceWith(element);
    } else {
      insertElement(element);
    }

    isDiceOpen.value = false;
    emitFromEditor();
  }

  function removeDice(): void {
    editingToken.value?.remove();

    isDiceOpen.value = false;
    emitFromEditor();
  }

  function handleEditorClick(event: MouseEvent): void {
    const { target } = event;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const token = target.closest(`.${DICE_TOKEN_CLASS}`);

    if (token instanceof HTMLElement) {
      openDice(false, token);
    }
  }

  function setMode(value: HtmlEditorMode): void {
    mode.value = value;
  }

  /**
   * Показывает ошибку в исходном коде: выделяет тег и прокручивает к нему.
   * Сам браузер к выделению не прокручивает, поэтому высота текста до ошибки
   * меряется, временно оставив в поле только его.
   * @param problem - ошибка разметки
   */
  async function showProblem(problem: HtmlProblem): Promise<void> {
    mode.value = 'source';

    await nextTick();

    const textarea = source.value;

    if (!textarea) {
      return;
    }

    const { value } = textarea;

    textarea.value = value.slice(0, problem.start);

    const offset = textarea.scrollHeight;

    textarea.value = value;
    // Без preventScroll браузер после фокуса уводит прокрутку к старой каретке
    textarea.focus({ preventScroll: true });
    textarea.setSelectionRange(problem.start, problem.end);
    textarea.scrollTop = Math.max(0, offset - textarea.clientHeight / 2);
  }

  // Автоисправление только по кнопке: браузер перестраивает разметку по
  // своим правилам, и результат стоит проверить глазами
  function fixProblems(): void {
    const fixed = fixHtmlProblems(model.value);

    emitValue(fixed);

    if (editor.value) {
      editor.value.innerHTML = htmlToEditable(fixed);
    }
  }

  watch(model, (value) => {
    if (value !== emitted.value) {
      syncFromModel();
    }
  });

  watch(mode, async (value) => {
    if (value === 'html') {
      await nextTick();

      syncFromModel();
    }
  });

  onMounted(() => {
    // Чтобы execCommand генерировал теги, а не стили
    document.execCommand('styleWithCSS', false, 'false');

    syncFromModel();
  });
</script>

<template>
  <div
    class="flex w-full flex-col overflow-hidden rounded-md border bg-default"
    :class="wrapperClass"
  >
    <div
      class="flex flex-wrap items-center justify-between gap-2 border-b border-default bg-elevated/50 p-1"
    >
      <div class="flex flex-wrap items-center gap-0.5">
        <UTooltip
          v-for="item in HTML_EDITOR_INLINE_COMMANDS"
          :key="item.command"
          :text="item.title"
        >
          <UButton
            :icon="item.icon"
            :aria-label="item.title"
            :disabled="isToolbarDisabled"
            color="neutral"
            variant="ghost"
            size="sm"
            @mousedown.prevent
            @click.left.exact.prevent="applyCommand(item)"
          />
        </UTooltip>

        <USeparator
          orientation="vertical"
          class="mx-1 h-5"
        />

        <UDropdownMenu
          :items="blockItems"
          :disabled="isToolbarDisabled"
        >
          <UButton
            :icon="HTML_EDITOR_ICON.heading"
            :aria-label="HTML_EDITOR_TEXT.heading"
            :disabled="isToolbarDisabled"
            color="neutral"
            variant="ghost"
            size="sm"
            @mousedown.prevent
          />
        </UDropdownMenu>

        <UTooltip
          v-for="item in HTML_EDITOR_LIST_COMMANDS"
          :key="item.command"
          :text="item.title"
        >
          <UButton
            :icon="item.icon"
            :aria-label="item.title"
            :disabled="isToolbarDisabled"
            color="neutral"
            variant="ghost"
            size="sm"
            @mousedown.prevent
            @click.left.exact.prevent="applyCommand(item)"
          />
        </UTooltip>

        <USeparator
          orientation="vertical"
          class="mx-1 h-5"
        />

        <UTooltip
          v-for="item in HTML_EDITOR_ALIGN_COMMANDS"
          :key="item.command"
          :text="item.title"
        >
          <UButton
            :icon="item.icon"
            :aria-label="item.title"
            :disabled="isToolbarDisabled"
            color="neutral"
            variant="ghost"
            size="sm"
            @mousedown.prevent
            @click.left.exact.prevent="applyCommand(item)"
          />
        </UTooltip>

        <USeparator
          orientation="vertical"
          class="mx-1 h-5"
        />

        <UTooltip :text="HTML_EDITOR_TEXT.dice">
          <UButton
            :icon="HTML_EDITOR_ICON.dice"
            :aria-label="HTML_EDITOR_TEXT.dice"
            :disabled="isToolbarDisabled"
            color="neutral"
            variant="ghost"
            size="sm"
            @mousedown.prevent
            @click.left.exact.prevent="openDice(false)"
          />
        </UTooltip>

        <UTooltip :text="HTML_EDITOR_TEXT.roll">
          <UButton
            :icon="HTML_EDITOR_ICON.roll"
            :aria-label="HTML_EDITOR_TEXT.roll"
            :disabled="isToolbarDisabled"
            color="neutral"
            variant="ghost"
            size="sm"
            @mousedown.prevent
            @click.left.exact.prevent="openDice(true)"
          />
        </UTooltip>
      </div>

      <div class="flex items-center gap-0.5">
        <UButton
          v-for="item in modeItems"
          :key="item.value"
          :label="item.label"
          :variant="item.variant"
          color="neutral"
          size="sm"
          @click.left.exact.prevent="setMode(item.value)"
        />
      </div>
    </div>

    <HtmlEditorProblems
      v-if="problems.length"
      :problems="problems"
      :disabled="disabled"
      @show="showProblem"
      @fix="fixProblems"
    />

    <div
      v-show="isVisual"
      ref="editor"
      :contenteditable="!disabled"
      :data-placeholder="placeholder"
      :style="contentStyle"
      :class="$style.content"
      class="content-render overflow-y-auto px-3 py-2.5 text-highlighted focus-visible:outline-none"
      aria-multiline="true"
      role="textbox"
      tabindex="0"
      @click="handleEditorClick"
      @input="emitFromEditor"
      @keyup="rememberRange"
      @mouseup="rememberRange"
    />

    <textarea
      v-show="!isVisual"
      ref="source"
      :disabled="disabled"
      :placeholder="placeholder"
      :rows="rows"
      :value="model"
      class="w-full resize-y bg-transparent px-3 py-2.5 font-mono text-sm text-highlighted focus-visible:outline-none"
      spellcheck="false"
      @change="handleSourceChange"
      @input="handleSourceInput"
    />

    <HtmlEditorDiceModal
      v-model:open="isDiceOpen"
      :token="diceToken"
      :is-editing="!!editingToken"
      :is-extended="isDiceExtended"
      @apply="applyDice"
      @remove="removeDice"
    />
  </div>
</template>

<style lang="scss" module>
  .content {
    &:empty::before {
      content: attr(data-placeholder);
      color: var(--text-g-color);
    }

    :global(.html-editor-dice) {
      cursor: pointer;
      border-bottom: 1px dashed currentcolor;
      font-weight: 500;
      white-space: nowrap;

      &:global(.is-dice) {
        color: var(--bg-dice);
      }

      &:global(.is-advantage) {
        color: var(--bg-advantage);
      }

      &:global(.is-disadvantage) {
        color: var(--bg-disadvantage);
      }

      &:global(.is-saving-throw) {
        color: var(--bg-saving-throw);
      }
    }
  }
</style>
