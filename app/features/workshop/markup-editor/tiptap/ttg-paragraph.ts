import type {
  JSONContent,
  MarkdownLexerConfiguration,
  MarkdownParseHelpers,
  MarkdownRendererHelpers,
  MarkdownToken,
  RenderContext,
} from '@tiptap/core';

import type { MarkerNode } from '~news/markup';

import type { DeferredInlineTokens } from './block-tokenizer';

import { Extension } from '@tiptap/core';
import { Paragraph } from '@tiptap/extension-paragraph';

import {
  EMPTY_PARAGRAPH_MARKDOWN,
  isMarkerNode,
  parse,
  serializeInlineNodes,
} from '~news/markup';

import {
  createBlockMarkerTokenizer,
  deferInline,
  markerNameMatches,
} from './block-tokenizer';
import { dataAttr } from './node-utils';

const PARAGRAPH_TOKEN = 'ttgParagraph';

/** Имена маркера абзаца (алиас `p` из markup/config.ts). */
const PARAGRAPH_NAMES = new Set(['p', 'paragraph']);

/** Разобранный абзац: выравнивание + ленивые инлайн-токены содержимого. */
interface ParagraphData {
  align?: string;
  inline: DeferredInlineTokens;
}

/**
 * Начинается ли строка ИМЕННО с маркера абзаца (`{@p`). Экспортируется для
 * marks.ts, чтобы блочный чип-токенайзер пропускал `{@p}` к нативному узлу.
 */
export function isParagraphMarkerStart(source: string): boolean {
  return markerNameMatches(source, PARAGRAPH_NAMES);
}

/**
 * Разбирает сырой `{@p …}` в структуру: выравнивание и уже разобранные инлайн-
 * токены содержимого. undefined — если это не абзац.
 */
function buildParagraphData(
  raw: string,
  lexer: MarkdownLexerConfiguration,
): ParagraphData | undefined {
  const node = parse(raw).find(
    (candidate): candidate is MarkerNode =>
      isMarkerNode(candidate) && candidate.type === 'paragraph',
  );

  if (!node) {
    return undefined;
  }

  return {
    align: typeof node.attrs?.align === 'string' ? node.attrs.align : undefined,
    inline: deferInline(lexer, serializeInlineNodes(node.content ?? [])),
  };
}

/**
 * БЛОЧНЫЙ токенайзер `{@p …}` → нативный редактируемый абзац TipTap с атрибутом
 * выравнивания. Обычные абзацы (простой текст) идут штатным разбором Markdown —
 * `{@p}` появляется ТОЛЬКО у выровненного абзаца (см. renderMarkdown ниже).
 */
export const ttgParagraphMarkdownTokenizer = createBlockMarkerTokenizer(
  PARAGRAPH_TOKEN,
  isParagraphMarkerStart,
  buildParagraphData,
);

/**
 * Хендлер markdown для выровненных абзацев: токен `ttgParagraph` → нативный узел
 * paragraph с атрибутом align. Отдельным расширением (а не на узле), как у
 * списков/таблиц/цитат/заголовков.
 */
export const TtgParagraphMarkdown = Extension.create({
  name: 'ttgParagraphMarkdown',

  markdownTokenName: PARAGRAPH_TOKEN,
  markdownTokenizer: ttgParagraphMarkdownTokenizer,
  // Поля align/inline кладёт в токен buildParagraphData (см. ParagraphData).
  // Читаем их через typeof-проверку без каста — токен типизирован свободно.
  parseMarkdown: (token: MarkdownToken, helpers: MarkdownParseHelpers) => {
    const align = typeof token.align === 'string' ? token.align : null;

    const inline: MarkdownToken[] =
      typeof token.inline === 'function' ? token.inline() : [];

    return helpers.createNode(
      'paragraph',
      { align },
      helpers.parseInline(inline),
    );
  },
});

/**
 * Абзац: тот же нативный узел TipTap, но с атрибутом выравнивания. Обычный абзац
 * сериализуется простым текстом (никакого `{@p}`), а выровненный — как
 * `{@p … | align:center|right}`. Логику пустого абзаца (сохранение пустой строки
 * маркером `&nbsp;`) повторяем из @tiptap/extension-paragraph, т.к. переопределяем
 * штатный renderMarkdown. Штатный parseMarkdown НЕ трогаем — обычные абзацы
 * приходят им.
 */
export const TtgParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: dataAttr('data-align', 'align'),
    };
  },
  renderMarkdown: (
    node: JSONContent,
    helpers: MarkdownRendererHelpers,
    ctx: RenderContext,
  ) => {
    const content = Array.isArray(node.content) ? node.content : [];

    // Пустой абзац: сохраняем пустую строку между абзацами так же, как штатный
    // рендер (маркер `&nbsp;` только если предыдущий абзац тоже пустой).
    if (content.length === 0) {
      const previous = ctx?.previousNode;

      const previousContent = Array.isArray(previous?.content)
        ? previous.content
        : [];

      const previousIsEmptyParagraph =
        previous?.type === 'paragraph' && previousContent.length === 0;

      return previousIsEmptyParagraph ? EMPTY_PARAGRAPH_MARKDOWN : '';
    }

    const inline = helpers.renderChildren(content);
    const align = node.attrs?.align;

    // Выравнивание хранится тегом `{@p}` только для center/right — `left` это
    // значение по умолчанию (обычный абзац-строка).
    if (align === 'center' || align === 'right') {
      return `{@p ${inline} | align:${align}}`;
    }

    return inline;
  },
  markdownOptions: { indentsContent: false },
});

/**
 * Набор расширений для нативных абзацев с выравниванием. Порядок: сперва markdown-
 * хендлер `{@p}`, затем узел (как в других ttg*Extensions).
 */
export const ttgParagraphExtensions = [TtgParagraphMarkdown, TtgParagraph];
