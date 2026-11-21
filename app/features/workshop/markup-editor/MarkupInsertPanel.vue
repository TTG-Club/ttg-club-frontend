<script setup lang="ts">
  import type { Editor } from '@tiptap/vue-3';

  import type { SearchResult } from '~infrastructure/search/model';

  import type { MarkupTag } from './tags';

  import { toMarkupLink } from '~content/model';
  import { useSiteSearch } from '~infrastructure/search/composables';

  import {
    SECTION_SEARCH_DEBOUNCE_MS,
    SECTION_SEARCH_HINT,
    SECTION_SEARCH_MIN_LENGTH,
    SECTION_SEARCH_SIZE,
    SITE_SECTION_TAG_KEY,
  } from './tags';
  import { hasMarkerAtom } from './tiptap/node-utils';
  import { sanitizeMarkerText } from './toolbar-items';

  /** Режим панели: поиск сущности раздела, ввод нотации кубика, подпись таблицы или URL ссылки. */
  type PanelMode =
    | { kind: 'section'; tag: MarkupTag }
    | { kind: 'dice'; tag: MarkupTag }
    | { kind: 'caption' }
    | { kind: 'link'; tag: MarkupTag };

  const { editor, mode } = defineProps<{
    editor: Editor;
    mode: PanelMode;
  }>();

  const emit = defineEmits<{ close: [] }>();

  // Диапазон и текст выделения на момент открытия — вставка пойдёт сюда, даже
  // если фокус ушёл в поле панели.
  const range = {
    from: editor.state.selection.from,
    to: editor.state.selection.to,
  };

  const selectedText = editor.state.doc
    .textBetween(range.from, range.to, ' ')
    .trim();

  // Если в выделении есть чипы-маркеры (узел ttgMarker), «плоский» selectedText
  // теряет их (сплющивает в пробел) — такой текст как подпись ненадёжен.
  const selectionHasChip = hasMarkerAtom(editor, range.from, range.to);

  // Начальное значение поля: подпись — текущий caption таблицы (редактирование);
  // ссылка — ПУСТО (поле = URL, метку берём из выделения при вставке); остальные —
  // выделенный текст (значение по умолчанию для вставки/поиска).
  function initialQuery(): string {
    if (mode.kind === 'caption') {
      return String(editor.getAttributes('table').caption ?? '');
    }

    // Ссылка → поле = URL (метку берём из выделения при вставке).
    if (mode.kind === 'link') {
      return '';
    }

    // Кубик → поле = ФОРМУЛА: выделил «1к6», нажал кубик — формула уже готова, и
    // Enter сразу вставляет бросок. Выделение с чипами в формулу не идёт: плоский
    // текст теряет их содержимое.
    if (mode.kind === 'dice') {
      return selectionHasChip ? '' : selectedText;
    }

    return selectedText;
  }

  const query = ref(initialQuery());

  // Показанный текст броска (что видно, напр. «+5»), если отличается от формулы
  // (query, напр. «1к20+5»). Пусто → показывается сама формула. По умолчанию —
  // выделение: выделил «+5», нажал кубик и дописал формулу — «+5» останется
  // видимым. Пишется в атрибут `text`: `{@dice <формула> | text:<текст>}`; если
  // текст совпал с формулой, атрибута нет. См. confirmDice.
  const diceDisplay = ref(mode.kind === 'dice' ? selectedText : '');

  const activeIndex = ref(0);
  const inputRef = useTemplateRef<HTMLInputElement>('input');

  // Поиск по сайту — только в режиме раздела и от двух символов.
  const searchTerm = refDebounced(
    computed(() => {
      const value = query.value.trim();

      return mode.kind === 'section'
        && value.length >= SECTION_SEARCH_MIN_LENGTH
        ? value
        : '';
    }),
    SECTION_SEARCH_DEBOUNCE_MS,
  );

  const { data, status } = useSiteSearch({
    key: 'workshop-markup-section',
    term: searchTerm,
    size: SECTION_SEARCH_SIZE,
    server: false,
  });

  const loading = computed(() => status.value === 'pending');

  // Поиск общий по сайту: для раздела остаются только его записи, у пункта
  // «Запись сайта» — все.
  const results = computed(() => {
    if (mode.kind !== 'section') {
      return [];
    }

    const { key } = mode.tag;

    return data.value.items.filter(
      (item) =>
        key === SITE_SECTION_TAG_KEY || toMarkupLink(item.url).type === key,
    );
  });

  watch(results, () => {
    activeIndex.value = 0;
  });

  /** Иконка поля панели по режиму. */
  const panelIcon = computed(() => {
    // Кубик: ведущее поле — формула (что катить), иконка кубика; у второго поля
    // (показанный текст) — иконка «текст».
    if (mode.kind === 'dice') {
      return 'tabler:dice';
    }

    if (mode.kind === 'caption') {
      return 'tabler:text-caption';
    }

    if (mode.kind === 'link') {
      return 'tabler:link';
    }

    return 'tabler:search';
  });

  /** Плейсхолдер поля панели по режиму. */
  const panelPlaceholder = computed(() => {
    if (mode.kind === 'dice') {
      return 'Формула, напр. 1к20+5';
    }

    if (mode.kind === 'caption') {
      return 'Подпись таблицы';
    }

    if (mode.kind === 'link') {
      return 'Вставьте ссылку, напр. https://…';
    }

    if (mode.kind === 'section') {
      return `Поиск: ${mode.tag.label}`;
    }

    return '';
  });

  /** aria-label поля панели по режиму. */
  const panelAriaLabel = computed(() => {
    if (mode.kind === 'dice') {
      return 'Формула броска';
    }

    if (mode.kind === 'caption') {
      return 'Подпись таблицы';
    }

    if (mode.kind === 'link') {
      return 'Ссылка (URL)';
    }

    return 'Поиск сущности';
  });

  onMounted(() => {
    nextTick(() => inputRef.value?.focus());
  });

  /** Вставляет маркер {@...} как атомарный узел-чип в позицию выделения. */
  function insertRaw(raw: string) {
    editor
      .chain()
      .focus()
      .insertContentAt(range, { type: 'ttgMarker', attrs: { raw } })
      .run();

    emit('close');
  }

  /**
   * Вставляет ссылку (раздел или обычную) РЕДАКТИРУЕМЫМ узлом `ttgSectionLink`:
   * подпись — текстовый контент (правится по буквам), `kind`/`url` — атрибуты.
   * Так вставленную ссылку можно править сразу, а не только после перезагрузки.
   */
  function insertSectionLink(kind: string, label: string, url: string) {
    editor
      .chain()
      .focus()
      .insertContentAt(range, {
        type: 'ttgSectionLink',
        attrs: { kind, url },
        content: label ? [{ type: 'text', text: label }] : [],
      })
      .run();

    emit('close');
  }

  function pickResult(result: SearchResult) {
    // Выбор сущности возможен только в режиме раздела (у него есть tag).
    if (mode.kind !== 'section') {
      return;
    }

    // Подпись — выделенный текст (если он надёжен) либо название сущности;
    // санитизуем, чтобы `|`/`}` не сломали атрибут url ссылки.
    const source =
      selectedText && !selectionHasChip ? selectedText : result.name;

    const label = sanitizeMarkerText(source);
    const link = toMarkupLink(result.url);

    insertSectionLink(link.type, label, link.url);
  }

  function confirmDice() {
    // Формула (content) — что катится; она же показывается, если не задан
    // отдельный текст. Обязательна.
    const formula = sanitizeMarkerText(query.value.trim());

    if (!formula) {
      return;
    }

    // Задан отдельный показанный текст, отличный от формулы → катим формулу, а
    // показываем текст: `{@dice 1к20+5 | text:+5}` (роллер катит контент-формулу,
    // а `text` рисует подпись). Иначе — обычный `{@dice 2к6}`.
    const display = sanitizeMarkerText(diceDisplay.value.trim());

    if (display && display !== formula) {
      insertRaw(`{@dice ${formula} | text:${display}}`);

      return;
    }

    insertRaw(`{@dice ${formula}}`);
  }

  /**
   * Обычная ссылка `{@link <текст> | url:<url>}`. Метка — надёжный выделенный текст,
   * иначе сам URL (чтобы ссылка была видимой), иначе плейсхолдер тега. URL кладём
   * как есть — обычные ссылки структурных символов маркера (`|`/`{`/`}`) не содержат.
   */
  function confirmLink() {
    if (mode.kind !== 'link') {
      return;
    }

    const url = query.value.trim();

    if (!url) {
      return;
    }

    const source = selectedText && !selectionHasChip ? selectedText : url;
    const label = sanitizeMarkerText(source) || mode.tag.placeholder;

    insertSectionLink('link', label, url);
  }

  /**
   * Подпись таблицы — это АТРИБУТ узла table (а не вставка чипа), поэтому пишем
   * его командой updateAttributes по текущему выделению (курсор внутри таблицы).
   * Пустая строка очищает подпись.
   */
  function confirmCaption() {
    // Санитизуем как подписи ссылок/нотацию кубика: `|`/`{`/`}` в подписи иначе
    // ломают {@caption …} при round-trip (обрезание по `|`, разбаланс по `}`).
    editor
      .chain()
      .focus()
      .updateAttributes('table', {
        caption: sanitizeMarkerText(query.value.trim()),
      })
      .run();

    emit('close');
  }

  function onEnter() {
    if (mode.kind === 'dice') {
      confirmDice();

      return;
    }

    if (mode.kind === 'caption') {
      confirmCaption();

      return;
    }

    if (mode.kind === 'link') {
      confirmLink();

      return;
    }

    const result = results.value[activeIndex.value];

    if (result) {
      pickResult(result);
    }
  }

  function moveActive(delta: number) {
    if (!results.value.length) {
      return;
    }

    activeIndex.value = Math.max(
      0,
      Math.min(results.value.length - 1, activeIndex.value + delta),
    );
  }

  function resultMeta(result: SearchResult): string {
    return [result.englishName, result.section].filter(Boolean).join(' · ');
  }
</script>

<template>
  <div class="border-b border-default bg-default shadow-lg">
    <div class="flex items-center gap-2 p-2">
      <UIcon
        :name="panelIcon"
        class="size-4 shrink-0 text-dimmed"
      />

      <input
        ref="input"
        v-model="query"
        :placeholder="panelPlaceholder"
        :aria-label="panelAriaLabel"
        class="min-w-0 flex-1 bg-transparent text-sm text-default outline-none"
        @keydown.enter.prevent="onEnter"
        @keydown.esc.prevent="emit('close')"
        @keydown.down.prevent="moveActive(1)"
        @keydown.up.prevent="moveActive(-1)"
      />

      <!-- Кубик: второе поле в той же строке — показанный текст (что видно),
           отдельно от формулы слева (что катится). Пусто → показывается формула. -->
      <template v-if="mode.kind === 'dice'">
        <div
          class="h-5 w-px shrink-0 bg-border"
          aria-hidden="true"
        />

        <UIcon
          name="tabler:cursor-text"
          class="size-4 shrink-0 text-dimmed"
        />

        <input
          v-model="diceDisplay"
          placeholder="Текст (необяз.), напр. +5"
          aria-label="Показанный текст броска"
          class="min-w-0 flex-1 bg-transparent text-sm text-default outline-none"
          @keydown.enter.prevent="onEnter"
          @keydown.esc.prevent="emit('close')"
        />
      </template>

      <UButton
        icon="tabler:x"
        aria-label="Закрыть"
        color="neutral"
        variant="ghost"
        size="xs"
        @click.left.exact.prevent="emit('close')"
      />
    </div>

    <div
      v-if="mode.kind === 'section'"
      class="max-h-56 overflow-y-auto border-t border-default"
    >
      <p
        v-if="loading"
        class="px-3 py-2 text-sm text-muted"
      >
        Поиск…
      </p>

      <p
        v-else-if="!searchTerm"
        class="px-3 py-2 text-sm text-muted"
      >
        {{ SECTION_SEARCH_HINT }}
      </p>

      <p
        v-else-if="!results.length"
        class="px-3 py-2 text-sm text-muted"
      >
        Ничего не найдено
      </p>

      <ul
        v-else
        class="py-1"
      >
        <li
          v-for="(result, index) in results"
          :key="result.url"
        >
          <button
            type="button"
            class="flex w-full flex-col items-start gap-0.5 px-3 py-1.5 text-left"
            :class="index === activeIndex ? 'bg-elevated' : ''"
            @click.left.exact.prevent="pickResult(result)"
            @mouseenter="activeIndex = index"
          >
            <span class="text-sm text-default">{{ result.name }}</span>

            <span
              v-if="resultMeta(result)"
              class="text-xs text-muted"
            >
              {{ resultMeta(result) }}
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
