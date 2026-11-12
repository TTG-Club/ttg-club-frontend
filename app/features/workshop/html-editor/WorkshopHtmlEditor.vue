<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type {
    DiceToken,
    HtmlEditorCommand,
    HtmlEditorLink,
    HtmlEditorMode,
    HtmlEditorWrapTag,
    HtmlProblem,
    HtmlTableAction,
  } from '../model';

  import {
    applyTableAction,
    BLOCK_TAGS,
    closestInEditor,
    compressHtml,
    createDiceToken,
    createLinkElement,
    createTable,
    createTokenElement,
    DICE_DEFAULT_LABEL,
    DICE_TOKEN_CLASS,
    editableToHtml,
    extractFormula,
    findHtmlProblems,
    findLinkElement,
    fixHtmlProblems,
    HTML_EDITOR_ALIGN_COMMANDS,
    HTML_EDITOR_BLOCKS,
    HTML_EDITOR_HIGHLIGHT,
    HTML_EDITOR_ICON,
    HTML_EDITOR_INLINE_COMMANDS,
    HTML_EDITOR_KBD,
    HTML_EDITOR_LIST_COMMANDS,
    HTML_EDITOR_MODE_VARIANT,
    HTML_EDITOR_MODES,
    HTML_EDITOR_ROW_HEIGHT,
    HTML_EDITOR_TABLE_ACTIONS,
    HTML_EDITOR_TABLE_SIZE,
    HTML_EDITOR_TEXT,
    htmlToEditable,
    insertBlock,
    linkFromElement,
    placeCaret,
    tokenFromElement,
    unwrapElement,
    wrapRange,
  } from '../model';
  import HtmlEditorDiceModal from './HtmlEditorDiceModal.vue';
  import HtmlEditorLinkModal from './HtmlEditorLinkModal.vue';
  import HtmlEditorProblems from './HtmlEditorProblems.vue';
  import HtmlEditorSectionModal from './HtmlEditorSectionModal.vue';

  /** Кнопка панели инструментов. */
  interface ToolbarButton {
    key: string;
    icon: string;
    title: string;
    onClick: () => void;
    /** Оформление уже применено к тексту под кареткой. */
    isActive?: boolean;
    class?: string;
  }

  /**
   * Кнопка нужна только на сенсорном экране: она заменяет Shift+Enter,
   * которого нет на экранной клавиатуре.
   */
  const TOUCH_ONLY_CLASS = 'pointer-fine:hidden';

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

  const isLinkOpen = ref(false);
  const isSectionOpen = ref(false);
  const linkValue = ref<HtmlEditorLink>({ text: '', url: '' });
  const sectionText = ref('');
  const editingLink = shallowRef<HTMLElement>();

  /** Команды и теги, которые уже применены к тексту под кареткой. */
  const activeKeys = shallowRef<ReadonlySet<string>>(new Set());

  /** Ячейка таблицы под кареткой: без неё операции с таблицей недоступны. */
  const activeCell = shallowRef<HTMLTableCellElement>();

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

  const tableItems = computed<Array<Array<DropdownMenuItem>>>(() => [
    [
      {
        label: HTML_EDITOR_TEXT.insertTable,
        icon: HTML_EDITOR_ICON.insertTable,
        onSelect: insertTable,
      },
    ],
    HTML_EDITOR_TABLE_ACTIONS.map((item) => ({
      label: item.label,
      icon: item.icon,
      disabled: !activeCell.value,
      onSelect: () => runTableAction(item.action),
    })),
  ]);

  const formatButtons = computed<Array<ToolbarButton>>(() => [
    ...HTML_EDITOR_INLINE_COMMANDS.map((item) => ({
      key: item.command,
      icon: item.icon,
      title: item.title,
      isActive: activeKeys.value.has(item.command),
      onClick: () => applyCommand(item),
    })),
    wrapButton(HTML_EDITOR_HIGHLIGHT),
  ]);

  const alignButtons = computed<Array<ToolbarButton>>(() =>
    HTML_EDITOR_ALIGN_COMMANDS.map((item) => ({
      key: item.command,
      icon: item.icon,
      title: item.title,
      onClick: () => applyCommand(item),
    })),
  );

  const blockButtons = computed<Array<ToolbarButton>>(() => [
    ...HTML_EDITOR_LIST_COMMANDS.map((item) => ({
      key: item.command,
      icon: item.icon,
      title: item.title,
      isActive: activeKeys.value.has(item.command),
      onClick: () => applyCommand(item),
    })),
    {
      key: 'blockquote',
      icon: HTML_EDITOR_ICON.quote,
      title: HTML_EDITOR_TEXT.quote,
      isActive: activeKeys.value.has('blockquote'),
      onClick: toggleQuote,
    },
    {
      key: 'separator',
      icon: HTML_EDITOR_ICON.separator,
      title: HTML_EDITOR_TEXT.separator,
      onClick: insertSeparator,
    },
  ]);

  const insertButtons = computed<Array<ToolbarButton>>(() => [
    {
      key: 'line-break',
      icon: HTML_EDITOR_ICON.lineBreak,
      title: HTML_EDITOR_TEXT.lineBreak,
      class: TOUCH_ONLY_CLASS,
      onClick: () => runCommand('insertLineBreak'),
    },
    wrapButton(HTML_EDITOR_KBD),
    {
      key: 'link',
      icon: HTML_EDITOR_ICON.link,
      title: HTML_EDITOR_TEXT.link,
      isActive: activeKeys.value.has('link'),
      onClick: openLink,
    },
    {
      key: 'dice',
      icon: HTML_EDITOR_ICON.dice,
      title: HTML_EDITOR_TEXT.dice,
      onClick: () => openDice(false),
    },
    {
      key: 'roll',
      icon: HTML_EDITOR_ICON.roll,
      title: HTML_EDITOR_TEXT.roll,
      onClick: () => openDice(true),
    },
    {
      key: 'section',
      icon: HTML_EDITOR_ICON.section,
      title: HTML_EDITOR_TEXT.section,
      onClick: openSection,
    },
  ]);

  /** Группы кнопок в порядке нового сайта: оформление, блок, вставки. */
  const toolbarGroups = computed(() => [
    formatButtons.value,
    alignButtons.value,
    blockButtons.value,
    insertButtons.value,
  ]);

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

  /**
   * Что уже применено под кареткой: для подсветки кнопок и меню таблицы.
   * @param range - выделение внутри редактора
   */
  function updateActiveState(range: Range): void {
    const root = editor.value;

    if (!root) {
      return;
    }

    const node = range.startContainer;
    const keys = new Set<string>();

    for (const item of [
      ...HTML_EDITOR_INLINE_COMMANDS,
      ...HTML_EDITOR_LIST_COMMANDS,
    ]) {
      if (document.queryCommandState(item.command)) {
        keys.add(item.command);
      }
    }

    for (const tag of [
      HTML_EDITOR_HIGHLIGHT.tag,
      HTML_EDITOR_KBD.tag,
      'blockquote',
    ]) {
      if (closestInEditor(node, tag, root)) {
        keys.add(tag);
      }
    }

    if (findLinkElement(node, root)) {
      keys.add('link');
    }

    activeKeys.value = keys;

    const cell = closestInEditor(node, 'td, th', root);

    activeCell.value = cell instanceof HTMLTableCellElement ? cell : undefined;
  }

  function rememberRange(): void {
    const range = getEditorRange();

    if (range) {
      lastRange.value = range.cloneRange();
      updateActiveState(range);
    }
  }

  /**
   * Возвращает фокус и выделение в редактор перед правкой.
   * @returns выделение; `undefined` — панель недоступна
   */
  function prepareSelection(): Range | undefined {
    if (isToolbarDisabled.value || !editor.value) {
      return undefined;
    }

    editor.value.focus();
    restoreRange();

    return getEditorRange() ?? lastRange.value;
  }

  /**
   * Завершает правку: ставит каретку и отдаёт разметку наружу.
   * @param caret - куда поставить каретку
   * @param isSelect - выделить содержимое узла
   */
  function finishEdit(caret?: Node, isSelect = false): void {
    if (caret?.isConnected) {
      placeCaret(caret, isSelect);
    } else {
      lastRange.value = undefined;
      activeCell.value = undefined;
    }

    rememberRange();
    emitFromEditor();
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

  /**
   * Кнопка тега-обёртки (`mark`, `kbd`): повторное нажатие снимает тег.
   * @param item - тег
   */
  function wrapButton(item: HtmlEditorWrapTag): ToolbarButton {
    return {
      key: item.tag,
      icon: item.icon,
      title: item.title,
      isActive: activeKeys.value.has(item.tag),
      onClick: () => toggleWrap(item),
    };
  }

  function toggleWrap(item: HtmlEditorWrapTag): void {
    const range = prepareSelection();
    const root = editor.value;

    if (!range || !root) {
      return;
    }

    const existing = closestInEditor(
      range.commonAncestorContainer,
      item.tag,
      root,
    );

    if (existing) {
      const first = existing.firstChild;

      unwrapElement(existing);
      finishEdit(first ?? undefined);

      return;
    }

    finishEdit(wrapRange(root, range, item.tag, item.placeholder), true);
  }

  /**
   * Цитата: абзац с кареткой становится цитатой, в цитате — снова абзацем.
   */
  function toggleQuote(): void {
    const range = prepareSelection();
    const root = editor.value;

    if (!range || !root) {
      return;
    }

    const quote = closestInEditor(range.startContainer, 'blockquote', root);

    if (!quote) {
      runCommand('formatBlock', 'blockquote');

      return;
    }

    const hasBlocks = Array.from(quote.children).some(
      (child) => child.tagName !== 'BR' && BLOCK_TAGS.includes(child.tagName),
    );

    if (hasBlocks) {
      const first = quote.firstChild;

      unwrapElement(quote);
      finishEdit(first ?? undefined);

      return;
    }

    const paragraph = document.createElement('p');

    paragraph.append(...Array.from(quote.childNodes));
    quote.replaceWith(paragraph);
    finishEdit(paragraph);
  }

  function insertSeparator(): void {
    const range = prepareSelection();

    if (!editor.value || isToolbarDisabled.value) {
      return;
    }

    const separator = document.createElement('hr');

    insertBlock(editor.value, separator, range);
    finishEdit(separator.nextElementSibling ?? undefined);
  }

  function insertTable(): void {
    const range = prepareSelection();

    if (!editor.value || isToolbarDisabled.value) {
      return;
    }

    const table = createTable(
      document,
      HTML_EDITOR_TABLE_SIZE.rows,
      HTML_EDITOR_TABLE_SIZE.columns,
    );

    insertBlock(editor.value, table, range);
    finishEdit(table.rows[0]?.cells[0]);
  }

  function runTableAction(action: HtmlTableAction): void {
    const cell = activeCell.value;

    if (!cell?.isConnected || isToolbarDisabled.value) {
      return;
    }

    prepareSelection();
    finishEdit(applyTableAction(cell, action), action === 'caption');
  }

  /**
   * Открывает окно ссылки: для ссылки под кареткой — на правку.
   */
  function openLink(): void {
    if (isToolbarDisabled.value || !editor.value) {
      return;
    }

    const range = getEditorRange() ?? lastRange.value;
    const existing = findLinkElement(range?.startContainer, editor.value);

    editingLink.value = existing;
    insertRange.value = existing ? undefined : range;

    linkValue.value = existing
      ? linkFromElement(existing)
      : { text: range?.toString().trim() ?? '', url: '' };

    isLinkOpen.value = true;
  }

  /**
   * Открывает поиск записи; ссылка под кареткой будет заменена.
   */
  function openSection(): void {
    if (isToolbarDisabled.value || !editor.value) {
      return;
    }

    const range = getEditorRange() ?? lastRange.value;
    const existing = findLinkElement(range?.startContainer, editor.value);

    editingLink.value = existing;
    insertRange.value = existing ? undefined : range;

    sectionText.value = existing
      ? linkFromElement(existing).text
      : (range?.toString().trim() ?? '');

    isSectionOpen.value = true;
  }

  function applyLink(link: HtmlEditorLink): void {
    const element = createLinkElement(link);

    if (editingLink.value?.isConnected) {
      editingLink.value.replaceWith(element);
    } else {
      insertElement(element);
    }

    isLinkOpen.value = false;
    isSectionOpen.value = false;
    emitFromEditor();
  }

  /** Снимает ссылку, текст остаётся. */
  function removeLink(): void {
    const element = editingLink.value;

    element?.replaceWith(document.createTextNode(element.textContent));

    isLinkOpen.value = false;
    emitFromEditor();
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
        <template
          v-for="(group, index) in toolbarGroups"
          :key="index"
        >
          <USeparator
            v-if="index"
            orientation="vertical"
            class="mx-1 h-5"
          />

          <UDropdownMenu
            v-if="index === 1"
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
            v-for="item in group"
            :key="item.key"
            :text="item.title"
          >
            <UButton
              :icon="item.icon"
              :aria-label="item.title"
              :aria-pressed="item.isActive"
              :disabled="isToolbarDisabled"
              :variant="item.isActive ? 'soft' : 'ghost'"
              :class="item.class"
              color="neutral"
              size="sm"
              @mousedown.prevent
              @click.left.exact.prevent="item.onClick"
            />
          </UTooltip>

          <UDropdownMenu
            v-if="index === 2"
            :items="tableItems"
            :disabled="isToolbarDisabled"
          >
            <UButton
              :icon="HTML_EDITOR_ICON.table"
              :aria-label="HTML_EDITOR_TEXT.table"
              :disabled="isToolbarDisabled"
              :variant="activeCell ? 'soft' : 'ghost'"
              color="neutral"
              size="sm"
              @mousedown.prevent
            />
          </UDropdownMenu>
        </template>
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

    <HtmlEditorLinkModal
      v-model:open="isLinkOpen"
      :link="linkValue"
      :is-editing="!!editingLink"
      @apply="applyLink"
      @remove="removeLink"
    />

    <HtmlEditorSectionModal
      v-model:open="isSectionOpen"
      :text="sectionText"
      @apply="applyLink"
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
