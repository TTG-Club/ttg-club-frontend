<script setup lang="ts">
  import { Icon } from '@iconify/vue';

  import {
    TOKEN_CLASS,
    compressHtml,
    createDiceToken,
    createTokenElement,
    editableToHtml,
    extractFormula,
    htmlToEditable,
    tokenFromElement,
  } from './helpers';

  import type { DiceToken, DiceVariant, HtmlEditorMode } from './types';

  const props = withDefaults(
    defineProps<{
      modelValue: string;
      rows?: number;
      placeholder?: string;
      disabled?: boolean;
      required?: boolean;
    }>(),
    {
      rows: 18,
      placeholder: 'Описание в формате HTML',
      disabled: false,
      required: false,
    },
  );

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
  }>();

  const MODE_OPTIONS: Array<{ label: string; value: HtmlEditorMode }> = [
    { label: 'HTML', value: 'html' },
    { label: 'Исходный код', value: 'source' },
  ];

  const VARIANT_OPTIONS: Array<{ label: string; value: DiceVariant }> = [
    { label: 'Обычный', value: 'dice' },
    { label: 'Преимущество', value: 'advantage' },
    { label: 'Помеха', value: 'disadvantage' },
    { label: 'Спасбросок', value: 'saving-throw' },
  ];

  const LABEL_OPTIONS = [
    'Бросок',
    'Атака',
    'Урон',
    'Восстановление хитов',
    'Проверка',
    'Спасбросок',
  ].map((label) => ({ label, value: label }));

  const HEADING_OPTIONS = [
    { label: 'Обычный текст', key: 'p' },
    { label: 'Заголовок 1', key: 'h1' },
    { label: 'Заголовок 2', key: 'h2' },
    { label: 'Заголовок 3', key: 'h3' },
    { label: 'Заголовок 4', key: 'h4' },
    { label: 'Заголовок 5', key: 'h5' },
  ];

  const ALIGN_BUTTONS = [
    {
      command: 'justifyLeft',
      icon: 'tabler:align-left',
      title: 'По левому краю',
    },
    {
      command: 'justifyCenter',
      icon: 'tabler:align-center',
      title: 'По центру',
    },
    {
      command: 'justifyRight',
      icon: 'tabler:align-right',
      title: 'По правому краю',
    },
  ];

  const LIST_BUTTONS = [
    {
      command: 'insertUnorderedList',
      icon: 'tabler:list',
      title: 'Маркированный список',
    },
    {
      command: 'insertOrderedList',
      icon: 'tabler:list-numbers',
      title: 'Нумерованный список',
    },
  ];

  const mode = ref<HtmlEditorMode>('html');
  const editor = ref<HTMLElement | null>(null);

  /**
   * Последняя отданная наружу разметка. Нужна, чтобы не переписывать
   * contenteditable в ответ на собственное же обновление модели — иначе
   * каждое нажатие клавиши сбрасывало бы каретку в начало.
   */
  const emitted = ref<string | null>(null);

  const dialogShown = ref(false);
  const dialogExtended = ref(false);
  const editing = shallowRef<HTMLElement | null>(null);
  const savedRange = shallowRef<Range | null>(null);
  const form = reactive<DiceToken>(createDiceToken());

  const dialogTitle = computed(() => {
    if (editing.value) {
      return 'Редактирование броска';
    }

    return dialogExtended.value ? 'Бросок' : 'Дайс';
  });

  // n-select с clearable отдаёт null, поэтому приводим значения формы вручную.
  const trimmed = (value: string | null | undefined) => (value || '').trim();

  const isFormValid = computed(() => !!trimmed(form.formula));

  const syncFromModel = () => {
    if (!editor.value) {
      return;
    }

    editor.value.innerHTML = htmlToEditable(props.modelValue || '');
  };

  const emitValue = (value: string) => {
    emitted.value = value;

    emit('update:modelValue', value);
  };

  const emitFromEditor = () => {
    if (!editor.value) {
      return;
    }

    emitValue(editableToHtml(editor.value.innerHTML));
  };

  const onSourceInput = (event: Event) => {
    if (event.target instanceof HTMLTextAreaElement) {
      emitValue(event.target.value);
    }
  };

  /**
   * Сжимаем не на каждый символ, а когда правка исходника закончена, —
   * иначе разметку невозможно было бы форматировать при наборе.
   */
  const onSourceChange = (event: Event) => {
    if (event.target instanceof HTMLTextAreaElement) {
      emitValue(compressHtml(event.target.value));
    }
  };

  /**
   * Последнее выделение внутри редактора. Дропдаун заголовков забирает фокус,
   * поэтому команды форматирования восстанавливают выделение из него.
   */
  const lastRange = shallowRef<Range | null>(null);

  const getRange = (): Range | null => {
    const selection = window.getSelection();

    if (selection?.rangeCount) {
      const range = selection.getRangeAt(0);

      if (editor.value?.contains(range.commonAncestorContainer)) {
        return range;
      }
    }

    return lastRange.value;
  };

  const rememberRange = () => {
    const selection = window.getSelection();

    if (!selection?.rangeCount) {
      return;
    }

    const range = selection.getRangeAt(0);

    if (editor.value?.contains(range.commonAncestorContainer)) {
      lastRange.value = range.cloneRange();
    }
  };

  const restoreRange = () => {
    const range = lastRange.value;

    if (!range) {
      return;
    }

    try {
      const selection = window.getSelection();

      selection?.removeAllRanges();
      selection?.addRange(range);
    } catch {
      lastRange.value = null;
    }
  };

  const findToken = (range: Range | null): HTMLElement | null => {
    const node = range?.startContainer;
    const element = node instanceof Element ? node : node?.parentElement;
    const token = element?.closest(`.${TOKEN_CLASS}`);

    return token instanceof HTMLElement ? token : null;
  };

  const focusEditor = () => {
    if (mode.value === 'html') {
      editor.value?.focus();
    }
  };

  const exec = (command: string) => {
    if (props.disabled || mode.value !== 'html') {
      return;
    }

    editor.value?.focus();
    restoreRange();
    document.execCommand(command);
    rememberRange();
    emitFromEditor();
  };

  /** Выравнивание пишем в `style`, а не в устаревший атрибут `align`. */
  const align = (command: string) => {
    if (props.disabled || mode.value !== 'html') {
      return;
    }

    editor.value?.focus();
    restoreRange();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command);
    document.execCommand('styleWithCSS', false, 'false');
    rememberRange();
    emitFromEditor();
  };

  const formatBlock = (tag: string) => {
    if (props.disabled || mode.value !== 'html') {
      return;
    }

    editor.value?.focus();
    restoreRange();
    document.execCommand('formatBlock', false, tag);
    rememberRange();
    emitFromEditor();
  };

  const openDialog = (extended: boolean, token: HTMLElement | null) => {
    if (props.disabled || mode.value !== 'html') {
      return;
    }

    const range = getRange();
    const target = token || findToken(range);

    editing.value = target;
    savedRange.value = target ? null : range;
    dialogExtended.value = extended;

    if (target) {
      Object.assign(form, tokenFromElement(target));

      dialogExtended.value =
        extended || form.variant !== 'dice' || !!form.label;
    } else {
      const selected = range?.toString().trim() || '';

      Object.assign(
        form,
        createDiceToken({
          formula: extractFormula(selected),
          text: selected,
          label: extended ? 'Бросок' : '',
        }),
      );
    }

    dialogShown.value = true;
  };

  const insertToken = (element: HTMLElement) => {
    const range = savedRange.value;

    if (!range) {
      editor.value?.append(element);

      return;
    }

    range.deleteContents();
    range.insertNode(element);

    const selection = window.getSelection();

    range.setStartAfter(element);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const applyToken = () => {
    if (!isFormValid.value) {
      return;
    }

    const element = createTokenElement(
      createDiceToken({
        ...form,
        formula: trimmed(form.formula),
        text: trimmed(form.text) || trimmed(form.formula),
        label: trimmed(form.label),
        source: trimmed(form.source),
      }),
    );

    if (editing.value) {
      editing.value.replaceWith(element);
    } else {
      insertToken(element);
    }

    dialogShown.value = false;
    emitFromEditor();
  };

  const removeToken = () => {
    editing.value?.remove();

    dialogShown.value = false;
    emitFromEditor();
  };

  const onEditorClick = (event: MouseEvent) => {
    const { target } = event;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const token = target.closest(`.${TOKEN_CLASS}`);

    if (token instanceof HTMLElement) {
      openDialog(false, token);
    }
  };

  watch(
    () => props.modelValue,
    (value) => {
      if (value !== emitted.value) {
        syncFromModel();
      }
    },
  );

  watch(mode, async (value) => {
    if (value === 'html') {
      await nextTick();

      syncFromModel();
    }
  });

  onMounted(() => {
    // Чтобы execCommand генерировал теги, а не inline-стили.
    document.execCommand('styleWithCSS', false, 'false');

    syncFromModel();
  });
</script>

<template>
  <div class="html-editor">
    <div class="html-editor__toolbar">
      <div class="html-editor__group">
        <button
          :disabled="disabled || mode === 'source'"
          class="html-editor__button is-bold"
          title="Жирный (Ctrl+B)"
          type="button"
          @click="exec('bold')"
          @mousedown.prevent
        >
          Ж
        </button>

        <button
          :disabled="disabled || mode === 'source'"
          class="html-editor__button is-italic"
          title="Курсив (Ctrl+I)"
          type="button"
          @click="exec('italic')"
          @mousedown.prevent
        >
          К
        </button>

        <span class="html-editor__divider" />

        <n-dropdown
          :disabled="disabled || mode === 'source'"
          :options="HEADING_OPTIONS"
          trigger="click"
          @select="formatBlock"
        >
          <button
            :disabled="disabled || mode === 'source'"
            class="html-editor__button"
            title="Заголовок (H1–H5)"
            type="button"
            @mousedown.prevent
          >
            <icon
              icon="tabler:heading"
              width="18"
              height="18"
            />
          </button>
        </n-dropdown>

        <button
          v-for="item in LIST_BUTTONS"
          :key="item.command"
          :disabled="disabled || mode === 'source'"
          :title="item.title"
          class="html-editor__button"
          type="button"
          @click="exec(item.command)"
          @mousedown.prevent
        >
          <icon
            :icon="item.icon"
            width="18"
            height="18"
          />
        </button>

        <span class="html-editor__divider" />

        <button
          v-for="item in ALIGN_BUTTONS"
          :key="item.command"
          :disabled="disabled || mode === 'source'"
          :title="item.title"
          class="html-editor__button"
          type="button"
          @click="align(item.command)"
          @mousedown.prevent
        >
          <icon
            :icon="item.icon"
            width="18"
            height="18"
          />
        </button>

        <span class="html-editor__divider" />

        <button
          :disabled="disabled || mode === 'source'"
          class="html-editor__button"
          title="Дайс — кликабельная формула, например 2к6"
          type="button"
          @click="openDialog(false, null)"
          @mousedown.prevent
        >
          <icon
            icon="tabler:dice-5"
            width="18"
            height="18"
          />
        </button>

        <button
          :disabled="disabled || mode === 'source'"
          class="html-editor__button"
          title="Бросок — формула с подписью, преимуществом или спасброском"
          type="button"
          @click="openDialog(true, null)"
          @mousedown.prevent
        >
          <icon
            icon="tabler:dice-6-filled"
            width="18"
            height="18"
          />
        </button>
      </div>

      <div class="html-editor__group html-editor__group--modes">
        <button
          v-for="option in MODE_OPTIONS"
          :key="option.value"
          :class="{ 'is-active': mode === option.value }"
          class="html-editor__button"
          type="button"
          @click="mode = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div
      v-show="mode === 'html'"
      ref="editor"
      :contenteditable="!disabled"
      :data-placeholder="placeholder"
      :style="{ minHeight: `${rows * 24}px` }"
      aria-multiline="true"
      class="html-editor__content"
      role="textbox"
      tabindex="0"
      @click="onEditorClick"
      @input="emitFromEditor"
      @keyup="rememberRange"
      @mouseup="rememberRange"
    />

    <textarea
      v-show="mode === 'source'"
      :disabled="disabled"
      :placeholder="placeholder"
      :rows="rows"
      :value="modelValue"
      class="html-editor__source"
      spellcheck="false"
      @change="onSourceChange"
      @input="onSourceInput"
    />

    <!--
      Проксирует нативную валидацию формы на contenteditable: сам он
      required быть не может, поэтому за него отчитывается скрытое поле.
    -->
    <input
      v-if="required"
      :value="modelValue"
      aria-hidden="true"
      class="html-editor__validation"
      required
      tabindex="-1"
      @focus="focusEditor"
    />

    <n-modal
      v-model:show="dialogShown"
      :title="dialogTitle"
      :style="{ maxWidth: '480px' }"
      preset="card"
    >
      <n-form
        label-placement="top"
        @submit.prevent="applyToken"
      >
        <n-form-item label="Формула">
          <n-input
            v-model:value="form.formula"
            placeholder="2к6 + 3"
          />
        </n-form-item>

        <n-form-item label="Текст">
          <n-input
            v-model:value="form.text"
            placeholder="Совпадает с формулой"
          />
        </n-form-item>

        <template v-if="dialogExtended">
          <n-form-item label="Подпись">
            <n-select
              v-model:value="form.label"
              :options="LABEL_OPTIONS"
              clearable
              filterable
              placeholder="Бросок"
              tag
            />
          </n-form-item>

          <n-form-item label="Тип">
            <n-radio-group v-model:value="form.variant">
              <n-radio-button
                v-for="option in VARIANT_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </n-radio-group>
          </n-form-item>

          <n-form-item label="Источник">
            <n-input
              v-model:value="form.source"
              placeholder="Необязательно"
            />
          </n-form-item>
        </template>
      </n-form>

      <template #footer>
        <div class="html-editor__modal-actions">
          <n-button
            v-if="editing"
            type="error"
            secondary
            @click="removeToken"
          >
            Удалить
          </n-button>

          <n-button @click="dialogShown = false"> Отмена </n-button>

          <n-button
            :disabled="!isFormValid"
            type="primary"
            @click="applyToken"
          >
            {{ editing ? 'Сохранить' : 'Вставить' }}
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/mixins' as *;

  .html-editor {
    position: relative;

    overflow: hidden;
    display: flex;
    flex-direction: column;

    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;

    &__toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: space-between;

      padding: 6px 8px;

      border-bottom: 1px solid var(--border);
    }

    &__group {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      align-items: center;
    }

    &__button {
      cursor: pointer;

      display: inline-flex;
      gap: 6px;
      align-items: center;

      min-height: 32px;
      padding: 4px 10px;

      font-size: calc(var(--main-font-size) - 1px);
      color: var(--text-color);

      background-color: transparent;
      border: 1px solid transparent;
      border-radius: 6px;

      @include css-anim();

      &:hover:not(:disabled) {
        background-color: var(--hover);
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 50%;
      }

      &.is-active {
        color: var(--text-btn-color);
        background-color: var(--primary);
      }

      &.is-bold {
        font-weight: 700;
      }

      &.is-italic {
        font-style: italic;
      }
    }

    &__divider {
      align-self: stretch;
      width: 1px;
      margin: 4px 2px;
      background-color: var(--border);
    }

    &__content,
    &__source {
      width: 100%;
      padding: 10px 12px;
      color: var(--text-b-color);
    }

    &__content {
      overflow-y: auto;

      &:focus-visible {
        outline: none;
      }

      &:empty::before {
        content: attr(data-placeholder);
        color: var(--text-g-color);
      }

      // Внутри contenteditable нет глобальной типографики сайта,
      // поэтому базовый вид блоков задаём здесь.
      :deep(h1),
      :deep(h2),
      :deep(h3),
      :deep(h4),
      :deep(h5) {
        margin: 8px 0;
        font-weight: 600;
        line-height: 1.25;
      }

      :deep(h1) {
        font-size: 1.6em;
      }

      :deep(h2) {
        font-size: 1.4em;
      }

      :deep(h3) {
        font-size: 1.25em;
      }

      :deep(h4) {
        font-size: 1.1em;
      }

      :deep(h5) {
        font-size: 1em;
      }

      :deep(ul),
      :deep(ol) {
        margin: 8px 0;
        padding-left: 24px;
      }

      :deep(ul) {
        list-style: disc;
      }

      :deep(ol) {
        list-style: decimal;
      }

      :deep(.html-editor-dice) {
        cursor: pointer;
        font-weight: 500;
        white-space: nowrap;
        border-bottom: 1px dashed currentcolor;

        &.is-dice {
          color: var(--bg-dice);
        }

        &.is-advantage {
          color: var(--bg-advantage);
        }

        &.is-disadvantage {
          color: var(--bg-disadvantage);
        }

        &.is-saving-throw {
          color: var(--bg-saving-throw);
        }
      }
    }

    &__source {
      resize: vertical;
      font-family: monospace;
      background-color: transparent;
      border: 0;

      &:focus-visible {
        outline: none;
      }
    }

    &__validation {
      position: absolute;

      width: 1px;
      height: 1px;
      padding: 0;

      opacity: 0%;
      border: 0;
    }

    &__modal-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
  }
</style>
