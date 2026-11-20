<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { MarkupEditorPreset, MarkupTag } from './tags';

  import { toMarkupSource, toStoredMarkup } from '~news/markup';

  import MarkupInsertPanel from './MarkupInsertPanel.vue';
  import {
    BASIC_TAG_KEYS,
    BLOCK_TAGS,
    FORMAT_TAGS,
    INLINE_TAGS,
    INTERACTIVE_TAGS,
    SECTION_TAGS,
  } from './tags';
  import {
    transformPastedMarkupHtml,
    TtgBlockMarker,
    ttgFormatMarks,
    ttgHeadingExtensions,
    TtgKeymap,
    ttgListExtensions,
    TtgMarker,
    ttgParagraphExtensions,
    ttgQuoteExtensions,
    TtgSectionLink,
    TtgSeparatorMarkdown,
    ttgTableExtensions,
  } from './tiptap';
  import { buildToolbarItems, TOOLBAR_LAYER_CLASS } from './toolbar-items';

  /** Режим панели ввода под тулбаром (поиск раздела / нотация кубика / подпись таблицы / URL ссылки). */
  type InsertPanelMode =
    | { kind: 'section'; tag: MarkupTag }
    | { kind: 'dice'; tag: MarkupTag }
    | { kind: 'caption' }
    | { kind: 'link'; tag: MarkupTag };

  // Маркеры {@...} в редакторе: форматирующие ({@i}/{@b}/…) — редактируемые марки
  // (можно вкладывать друг в друга и Markdown), остальные — атомарные чипы.
  // Списки {@list} — НАТИВНЫЕ узлы TipTap (см. ttgListExtensions).
  const editorExtensions = [
    TtgMarker,
    TtgBlockMarker,
    TtgSectionLink,
    TtgSeparatorMarkdown,
    TtgKeymap,
    ...ttgFormatMarks,
    ...ttgHeadingExtensions,
    ...ttgParagraphExtensions,
    ...ttgListExtensions,
    ...ttgTableExtensions,
    ...ttgQuoteExtensions,
  ];

  // Наружу модель — форма хранения: массив строк-блоков разметки, как его
  // отдаёт и принимает бэкенд. Автор же правит обычный ИСХОДНИК «Markdown +
  // {@...}» (`source`, блоки через пустую строку): блоки → исходник
  // `toMarkupSource`, правки обратно — `toStoredMarkup`.
  const model = defineModel<Array<string>>({ default: () => [] });

  const { placeholder = 'Опиши материал', preset = 'full' } = defineProps<{
    placeholder?: string;
    /**
     * Набор кнопок: `full` — всё для мастерской, `basic` — только оформление
     * текста (жирный/курсив/…, заголовки, списки, цитата, ссылка) для
     * пользовательских форм вроде баг-репорта.
     */
    preset?: MarkupEditorPreset;
  }>();

  // Интеграция с обёрткой UFormField (как у UTextarea): id/имя, aria, события
  // валидации и подсветка ошибки. Вне формы всё безопасно вырождается в no-op.
  const {
    emitFormInput,
    emitFormChange,
    emitFormBlur,
    id,
    name,
    highlight,
    ariaAttrs,
  } = useFormField(undefined, { deferInputValidation: true });

  // Редактируемый исходник, с которым работает UEditor. РАЗВЯЗАН с моделью: UEditor
  // видит только эту строку и никогда — результат обратного разбора, поэтому нет
  // «эха»/скачков курсора при round-trip source↔структура. Инициализируется из
  // модели immediate-watcher'ом ниже (не читаем model.value в setup напрямую).
  const source = ref('');

  // Последние синхронизированные значения по обе стороны. По ним отличаем СВОЮ
  // запись (эхо, игнорируем) от ВНЕШНЕЙ смены (загрузка/сброс формы, применяем) —
  // без липких флагов и гонок. Модель сравнивается по JSON-ключу блоков.
  let lastModelKey = '';
  let lastSource = '';

  // Ключ модели в том виде, в каком её записал бы редактор: без него правка,
  // не меняющая блоков (лишний пробел, пустой абзац), считалась бы изменением
  // формы.
  let canonicalKey = '';

  // Правка автора (source) → блоки модели. Свою же синхронизацию из модели
  // (source === lastSource) назад не пишем, иначе форма ложно становится «изменённой».
  watch(source, (value) => {
    if (value === lastSource) {
      return;
    }

    lastSource = value;

    const stored = toStoredMarkup(value);
    const key = JSON.stringify(stored);

    // Разметка та же, разошлось только оформление исходника — модель не трогаем.
    if (key === canonicalKey) {
      return;
    }

    canonicalKey = key;
    lastModelKey = key;
    model.value = stored;

    // Ввод в редактор → сообщаем форме (гасит ошибку валидации по мере ввода).
    emitFormInput();
  });

  // Внешняя смена модели (маунт/загрузка/сброс формы) → пересобрать исходник. Свою
  // же запись пропускаем, чтобы не дёргать редактор. immediate выполняет и
  // первичную инициализацию source из модели на маунте.
  watch(
    model,
    (value) => {
      const key = JSON.stringify(value);

      if (key === lastModelKey) {
        return;
      }

      lastModelKey = key;

      const next = toMarkupSource(value);

      lastSource = next;
      canonicalKey = JSON.stringify(toStoredMarkup(next));
      source.value = next;
    },
    { immediate: true },
  );

  /** Потеря фокуса редактором/полем — триггерим change+blur валидацию формы. */
  function handleFieldBlur() {
    emitFormChange();
    emitFormBlur();
  }

  // false — визуальный режим (UEditor), true — сырой код (textarea).
  const showCode = ref(false);
  const textareaRef = useTemplateRef<HTMLTextAreaElement>('textarea');

  // Отключаем встроенные Markdown-узлы/марки StarterKit, которые сериализуются в
  // Markdown (заголовки/списки/цитата/ссылка + `**`/`*`/`~~`). Всё
  // форматирование даёт наш ttgFormatMarks ({@b}/{@i}/…), а блочные элементы —
  // нативные ttg-узлы ({@h}/{@list}/{@quote}/{@table}) либо {@...}-чипы. Так
  // визуальный редактор НИКОГДА не выдаёт Markdown наружу.
  //
  // heading/paragraph заменяем СВОИМИ узлами (TtgHeading/TtgParagraph): заголовок
  // становится редактируемым и сериализуется в `{@h … | level:N}`, а абзац несёт
  // атрибут выравнивания и при align → `{@p … | align:…}` (см. ttg-heading.ts /
  // ttg-paragraph.ts).
  const starterKit = {
    heading: false,
    paragraph: false,
    bulletList: false,
    orderedList: false,
    listItem: false,
    blockquote: false,
    link: false,
    bold: false,
    italic: false,
    strike: false,
    // Underline StarterKit не сериализуется в {@u} и вешает СВОЙ Mod-u —
    // отключаем, чтобы Ctrl+U однозначно переключал ttgUnderline (marks.ts).
    underline: false,
    // Shift+Enter (hardBreak) сериализуется в «  \n» — одиночный перенос строки,
    // на котором падает бэкенд-десериализатор описания. Отключаем: перенос — это
    // новый абзац (Enter). Так наружу не уходит «сырой» одиночный \n.
    hardBreak: false,
    // Блок кода сериализуется в ``` — маркера под него в разметке нет, и такой
    // блок вышел бы на страницу тройными бэктиками. Код из буфера раскладывается
    // построчно обычным текстом (см. transformPastedMarkupHtml).
    codeBlock: false,
  } as const;

  // Правки ProseMirror: приводим ЧУЖОЙ HTML из буфера к нашей схеме. Без этого
  // ProseMirror молча теряет `<strong>`/`<em>`/`<a>` (их марок в схеме нет), а
  // `<hr>`, `<code>` и `<img>` доживают до сохранения чужими узлами и печатаются
  // на странице мусорным текстом.
  const editorProps = { transformPastedHTML: transformPastedMarkupHtml };

  // Markdown здесь — лишь ТРАНСПОРТ для round-trip наших {@...}. Формат Markdown
  // мы не используем, поэтому GFM выключен: `| a | b |`, `~~зачёркнутое~~`,
  // автоссылки и т.п. НЕ интерпретируются как разметка (у нас всё через {@...}).
  const markdownConfig = { markedOptions: { gfm: false } };

  // Класс контейнера редактора: при ошибке валидации подсвечиваем рамкой error,
  // иначе обычная рамка с подсветкой primary при фокусе.
  const containerClass = computed(() => [
    'flex h-60 min-h-40 min-w-0 resize-y flex-col overflow-hidden rounded-md border',
    highlight.value
      ? 'border-error'
      : 'border-default focus-within:border-primary',
  ]);

  // Панель ввода под тулбаром: null — закрыта. Открывается кнопками раздела/кубика.
  const insertPanel = ref<InsertPanelMode | null>(null);

  function openSectionPanel(tag: MarkupTag) {
    insertPanel.value = { kind: 'section', tag };
  }

  function openLinkPanel(tag: MarkupTag) {
    insertPanel.value = { kind: 'link', tag };
  }

  function openDicePanel(tag: MarkupTag) {
    insertPanel.value = { kind: 'dice', tag };
  }

  function openCaptionPanel() {
    insertPanel.value = { kind: 'caption' };
  }

  function closeInsertPanel() {
    insertPanel.value = null;
  }

  // Ключ панели: пересоздаёт её при смене режима/раздела (у подписи tag нет).
  const insertPanelKey = computed(() => {
    const panel = insertPanel.value;

    if (!panel || panel.kind === 'caption') {
      return 'caption';
    }

    return `${panel.kind}:${panel.tag.key}`;
  });

  // Те же группы и порядок, что и в визуальном тулбаре (форматы → блок →
  // kbd+интерактив → раздел), чтобы набор кнопок совпадал в обоих режимах.
  // Базовый пресет оставляет из них только теги BASIC_TAG_KEYS.
  const codeToolbarGroups = computed<MarkupTag[][]>(() => {
    const groups: MarkupTag[][] = [
      FORMAT_TAGS,
      BLOCK_TAGS,
      [...INLINE_TAGS, ...INTERACTIVE_TAGS],
    ];

    if (preset === 'full') {
      return groups;
    }

    return groups
      .map((group) => group.filter((tag) => BASIC_TAG_KEYS.has(tag.key)))
      .filter((group) => group.length > 0);
  });

  // Ссылки на разделы сайта — доменная вставка, в базовом пресете их нет.
  const hasSectionLinks = computed(() => preset === 'full');

  const sectionItems = computed<DropdownMenuItem[]>(() =>
    SECTION_TAGS.map((tag) => ({
      label: tag.label,
      icon: tag.icon,
      onSelect: () => insertIntoCode(tag),
    })),
  );

  function toggleMode() {
    closeInsertPanel();
    showCode.value = !showCode.value;
  }

  // Разделитель абзацев в МОДЕЛИ — пустая строка (\n\n): так нужно бэкенду и
  // визуальному редактору (там пустая строка = новый абзац). В режиме кода
  // показываем КОМПАКТНО — каждый абзац на своей строке (\n), без «пустых»
  // строк-разделителей, которые пришлось бы удалять вручную. При правке кода
  // одиночный \n снова разворачивается в \n\n, поэтому «сырой» одиночный \n
  // (на котором падает бэкенд) физически не попадает в модель/сохранение.
  const codeValue = computed({
    get: () => source.value.replace(/\n{2,}/g, '\n'),
    set: (value) => {
      source.value = value.replace(/\n/g, '\n\n');
    },
  });

  /**
   * Вставляет разметку тега в позицию курсора текстового поля режима кода:
   * оборачивает выделение либо подставляет значение-заглушку.
   */
  function insertIntoCode(tag: MarkupTag) {
    const element = textareaRef.value;

    if (!element) {
      return;
    }

    const { selectionStart, selectionEnd } = element;
    const source = codeValue.value;

    const selected =
      source.slice(selectionStart, selectionEnd) || tag.placeholder;

    const inserted = `${tag.before}${selected}${tag.after}`;

    codeValue.value =
      source.slice(0, selectionStart) + inserted + source.slice(selectionEnd);

    const cursor = selectionStart + tag.before.length;

    nextTick(() => {
      element.focus();
      element.setSelectionRange(cursor, cursor + selected.length);
    });
  }
</script>

<template>
  <div class="markup-editor-table grid min-w-0 grid-cols-1 gap-2">
    <div class="flex items-center justify-start gap-2">
      <UButton
        variant="ghost"
        size="xs"
        :icon="showCode ? 'tabler:eye' : 'tabler:code'"
        @click.left.exact.prevent="toggleMode"
      >
        {{ showCode ? 'Визуальный вид' : 'Показать код' }}
      </UButton>
    </div>

    <ClientOnly>
      <!-- Общий контейнер с изменяемым размером (тянуть за нижний угол). Он
           ОДИН на оба режима, поэтому заданная высота сохраняется при
           переключении «код ↔ визуальный вид». -->
      <div :class="containerClass">
        <UEditor
          v-if="!showCode"
          v-model="source"
          content-type="markdown"
          :markdown="markdownConfig"
          :starter-kit="starterKit"
          :extensions="editorExtensions"
          :editor-props="editorProps"
          :image="false"
          :mention="false"
          :placeholder
          class="flex min-h-0 min-w-0 flex-1 flex-col"
          :ui="{
            content: 'min-h-0 min-w-0 flex-1 overflow-y-auto',
            base: 'px-3 py-3 sm:px-3',
          }"
          @blur="handleFieldBlur"
        >
          <template #default="{ editor }">
            <div class="relative shrink-0">
              <UEditorToolbar
                :editor
                :items="
                  buildToolbarItems(
                    editor,
                    {
                      onSection: openSectionPanel,
                      onLink: openLinkPanel,
                      onDice: openDicePanel,
                      onCaption: openCaptionPanel,
                    },
                    preset,
                  )
                "
                class="flex-wrap border-b border-default"
                :ui="{ group: 'flex-wrap' }"
              />

              <MarkupInsertPanel
                v-if="insertPanel"
                :key="insertPanelKey"
                :editor
                :mode="insertPanel"
                class="absolute inset-x-0 top-full z-20"
                @close="closeInsertPanel"
              />
            </div>
          </template>
        </UEditor>

        <div
          v-else
          class="flex min-h-0 min-w-0 flex-1 flex-col"
        >
          <div
            class="flex shrink-0 flex-wrap items-center gap-1 border-b border-default p-1"
          >
            <div
              v-for="(group, groupIndex) in codeToolbarGroups"
              :key="groupIndex"
              class="flex items-center gap-0.5"
            >
              <UTooltip
                v-for="tag in group"
                :key="tag.key"
                :text="tag.label"
                :ui="{ content: TOOLBAR_LAYER_CLASS }"
              >
                <UButton
                  :icon="tag.icon"
                  :aria-label="tag.label"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  @click.left.exact.prevent="insertIntoCode(tag)"
                />
              </UTooltip>
            </div>

            <UDropdownMenu
              v-if="hasSectionLinks"
              :items="sectionItems"
              :ui="{ content: TOOLBAR_LAYER_CLASS }"
            >
              <UButton
                icon="tabler:external-link"
                aria-label="Ссылка на раздел"
                color="neutral"
                variant="ghost"
                size="xs"
              />
            </UDropdownMenu>
          </div>

          <textarea
            :id="id"
            ref="textarea"
            v-model="codeValue"
            :name="name"
            :placeholder
            class="min-h-0 w-full flex-1 resize-none bg-default px-3 py-3 font-mono text-sm leading-6 text-default outline-none"
            v-bind="ariaAttrs"
            @blur="handleFieldBlur"
          />
        </div>
      </div>

      <template #fallback>
        <UTextarea
          v-model="source"
          :rows="8"
          :placeholder
        />
      </template>
    </ClientOnly>
  </div>
</template>

<style scoped>
  /* Нативная таблица внутри визуального редактора (ProseMirror + extension-table).
     Ни StarterKit, ни @nuxt/ui таблиц не содержат, поэтому CSS для них никто не
     задаёт — без этих правил таблица в редакторе выглядит «сломанной»/обрезанной.
     Стили повторяют вид таблицы на странице материала (MarkupTable.vue). */

  /* Обёртка таблицы (node view extension-table): даём горизонтальный скролл,
     чтобы широкая таблица прокручивалась, а не обрезалась в редакторе. */
  .markup-editor-table :deep(.tableWrapper) {
    overflow-x: auto;
    margin: 0.5rem 0;
  }

  .markup-editor-table :deep(table) {
    table-layout: fixed;
    border-collapse: collapse;
    width: 100%;
  }

  .markup-editor-table :deep(:is(th, td)) {
    position: relative; /* для .selectedCell и ручки ресайза колонки */

    box-sizing: border-box;
    min-width: 3rem;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--ui-border);

    vertical-align: top;
  }

  .markup-editor-table :deep(th) {
    font-weight: 600;
    color: var(--ui-text-highlighted);
    text-align: center;
    background-color: var(--ui-bg-muted);
  }

  /* Абзацы внутри ячеек не должны добавлять свои вертикальные отступы. */
  .markup-editor-table :deep(:is(th, td) > p) {
    margin: 0;
  }

  /* Выравнивание по атрибуту align → data-align — как на странице, и для тела,
     и для заголовков. Явный left перебивает дефолты (тело слева, заголовок — по
     центру), поэтому правило для left тоже нужно. */
  .markup-editor-table :deep(:is(th, td)[data-align='left']) {
    text-align: left;
  }

  .markup-editor-table :deep(:is(th, td)[data-align='center']) {
    text-align: center;
  }

  .markup-editor-table :deep(:is(th, td)[data-align='right']) {
    text-align: right;
  }

  /* Подпись таблицы (атрибут caption → data-caption) — показываем над таблицей
     прямо в редакторе, чтобы автор видел заданную подпись. */
  .markup-editor-table :deep(table[data-caption]::before) {
    caption-side: top;
    content: attr(data-caption);

    display: table-caption;

    padding: 0.25rem 0.5rem;

    font-weight: 600;
    color: var(--ui-text-highlighted);
    text-align: center;
  }

  /* Нативная цитата (blockquote) в редакторе: StarterKit-стилей нет (blockquote
     отключён), поэтому без CSS она неотличима от обычных абзацев. На странице
     цитата рисуется богатым MarkupQuote/UCard — здесь только явный вид для автора. */
  .markup-editor-table :deep(.tiptap blockquote) {
    margin: 0.5rem 0;
    padding: 0.25rem 0.75rem;
    border-left: 4px solid var(--ui-border-accented);
    color: var(--ui-text-toned);
  }

  .markup-editor-table :deep(.tiptap blockquote > p) {
    margin: 0;
  }

  /* Нативный заголовок (TtgHeading) в редакторе: StarterKit-heading отключён, а
     наш узел рендерит h1–h4 по пользовательскому уровню 1–4. Стилизуем размеры
     под вид заголовка на странице (MarkupHeading), чтобы автор видел иерархию. */
  .markup-editor-table :deep(.tiptap :is(h1, h2, h3, h4)) {
    font-weight: 600;
    line-height: 1.3;
    color: var(--ui-text-highlighted);
  }

  .markup-editor-table :deep(.tiptap h1) {
    margin: 0.75rem 0 0.5rem;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid var(--ui-border);
    font-size: 1.25rem;
  }

  .markup-editor-table :deep(.tiptap h2) {
    margin: 0.6rem 0 0.35rem;
    font-size: 1.125rem;
  }

  .markup-editor-table :deep(.tiptap h3) {
    margin: 0.5rem 0 0.25rem;
    font-size: 1rem;
  }

  .markup-editor-table :deep(.tiptap h4) {
    margin: 0.4rem 0 0.2rem;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  /* Выравнивание любого текстового блока (абзац/заголовок) по атрибуту align →
     data-align. Значение хранит TtgParagraph/TtgHeading; так автор видит
     выравнивание прямо в редакторе, как оно будет на странице. */
  .markup-editor-table
    :deep(.tiptap :is(p, h1, h2, h3, h4)[data-align='center']) {
    text-align: center;
  }

  .markup-editor-table
    :deep(.tiptap :is(p, h1, h2, h3, h4)[data-align='right']) {
    text-align: right;
  }

  .markup-editor-table
    :deep(.tiptap :is(p, h1, h2, h3, h4)[data-align='left']) {
    text-align: left;
  }

  /* Подсветка выделенной при редактировании ячейки (prosemirror-tables). */
  .markup-editor-table :deep(.selectedCell::after) {
    pointer-events: none;
    content: '';

    position: absolute;
    inset: 0;

    opacity: 0.25;
    background-color: var(--ui-border-accented);
  }

  /* Ручка изменения ширины колонки (prosemirror-tables). */
  .markup-editor-table :deep(.column-resize-handle) {
    pointer-events: none;

    position: absolute;
    top: 0;
    right: -1px;
    bottom: 0;

    width: 3px;

    background-color: var(--ui-border-accented);
  }

  .markup-editor-table :deep(.tiptap.resize-cursor) {
    cursor: col-resize;
  }
</style>
