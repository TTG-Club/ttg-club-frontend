import type {
  JSONContent,
  MarkdownLexerConfiguration,
  MarkdownParseHelpers,
  MarkdownRendererHelpers,
  MarkdownToken,
} from '@tiptap/core';

import type { MarkerNode, RenderNode } from '~news/markup';

import type { DeferredInlineTokens } from './block-tokenizer';

import { Extension } from '@tiptap/core';
import { Blockquote } from '@tiptap/extension-blockquote';

import { isMarkerNode, parse, serializeInlineNodes } from '~news/markup';

import {
  createBlockMarkerTokenizer,
  deferInline,
  markerNameMatches,
} from './block-tokenizer';
import { dataAttr } from './node-utils';

const QUOTE_TOKEN = 'ttgQuote';

/** Имена маркеров, обозначающих цитату (алиасы из markup/config.ts). */
const QUOTE_NAMES = new Set(['quote', 'blockquote', 'q']);

/** Разобранная цитата: абзацы (ленивые инлайн-токены) + атрибуты оформления. */
interface QuoteData {
  paragraphs: { tokens: DeferredInlineTokens }[];
  color?: string;
  variant?: string;
}

/**
 * Начинается ли строка ИМЕННО с маркера цитаты (`{@quote`/`{@blockquote`/`{@q`).
 * Читаем имя маркера (до пробела/`}`) и сверяем со списком — так `{@quotefoo`
 * не пройдёт. Экспортируется для marks.ts, чтобы блочный чип-токенайзер пропускал
 * цитату к нативному узлу (как списки/таблицы).
 */
export function isQuoteMarkerStart(source: string): boolean {
  return markerNameMatches(source, QUOTE_NAMES);
}

/** Это узел-перенос строки `{@br}` (в парсере — маркер типа `break`). */
function isBreakNode(node: RenderNode): boolean {
  return isMarkerNode(node) && node.type === 'break';
}

/**
 * Группирует ПЛОСКОЕ содержимое цитаты (текст + маркеры `break`) в абзацы: пробег
 * из ≥2 подряд идущих `{@br}` — граница абзаца (все переносы пробега съедаются),
 * одиночный `{@br}` — мягкий перенос ВНУТРИ абзаца (остаётся в инлайне).
 */
function groupParagraphs(content: RenderNode[]): RenderNode[][] {
  const paragraphs: RenderNode[][] = [];

  let current: RenderNode[] = [];
  let cursor = 0;

  while (cursor < content.length) {
    const node = content[cursor];

    if (node !== undefined && isBreakNode(node)) {
      let runEnd = cursor;

      while (runEnd < content.length) {
        const next = content[runEnd];

        if (next === undefined || !isBreakNode(next)) {
          break;
        }

        runEnd++;
      }

      if (runEnd - cursor >= 2) {
        paragraphs.push(current);
        current = [];
      } else {
        current.push(node);
      }

      cursor = runEnd;

      continue;
    }

    if (node !== undefined) {
      current.push(node);
    }

    cursor++;
  }

  paragraphs.push(current);

  return paragraphs;
}

/**
 * Разбирает сырой `{@quote …}` в структуру абзацев с уже разобранными инлайн-
 * токенами и атрибутами (color/variant). undefined — если это не цитата.
 */
function buildQuoteData(
  raw: string,
  lexer: MarkdownLexerConfiguration,
): QuoteData | undefined {
  const node = parse(raw).find(
    (candidate): candidate is MarkerNode =>
      isMarkerNode(candidate) && candidate.type === 'quote',
  );

  if (!node) {
    return undefined;
  }

  const groups = groupParagraphs(node.content ?? []);

  const paragraphs = (groups.length ? groups : [[]]).map((group) => ({
    tokens: deferInline(lexer, serializeInlineNodes(group)),
  }));

  return {
    paragraphs,
    color: typeof node.attrs?.color === 'string' ? node.attrs.color : undefined,
    variant:
      typeof node.attrs?.variant === 'string' ? node.attrs.variant : undefined,
  };
}

/**
 * БЛОЧНЫЙ токенайзер `{@quote …}` → нативный редактируемый узел blockquote (в
 * отличие от `ttgBlockMarker`, который делает атомарный чип). `blockMarkerMarkdown
 * Tokenizer` цитату намеренно пропускает (см. isQuoteMarkerStart).
 */
export const ttgQuoteMarkdownTokenizer = createBlockMarkerTokenizer(
  QUOTE_TOKEN,
  isQuoteMarkerStart,
  buildQuoteData,
);

/**
 * Хендлер markdown для цитат: токен `ttgQuote` → нативный blockquote с абзацами.
 * Отдельным расширением (а не на узле), как у списков/таблиц.
 */
export const TtgQuoteMarkdown = Extension.create({
  name: 'ttgQuoteMarkdown',

  markdownTokenName: QUOTE_TOKEN,
  markdownTokenizer: ttgQuoteMarkdownTokenizer,
  // Поля color/variant/paragraphs кладёт в токен buildQuoteData (см. QuoteData).
  // Читаем их через typeof-проверку без каста — токен типизирован свободно.
  parseMarkdown: (token: MarkdownToken, helpers: MarkdownParseHelpers) => {
    const color = typeof token.color === 'string' ? token.color : null;
    const variant = typeof token.variant === 'string' ? token.variant : null;

    const paragraphs: QuoteData['paragraphs'] = Array.isArray(token.paragraphs)
      ? token.paragraphs
      : [];

    return helpers.createNode(
      'blockquote',
      { color, variant },
      paragraphs.map((paragraph) => ({
        type: 'paragraph',
        content: helpers.parseInline(paragraph.tokens()),
      })),
    );
  },
});

/** Хвост атрибутов оформления цитаты ` | color:… | variant:…`. */
function quoteAttrs(node: JSONContent): string {
  const parts: string[] = [];

  if (node.attrs?.color) {
    parts.push(`color:${String(node.attrs.color)}`);
  }

  if (node.attrs?.variant) {
    parts.push(`variant:${String(node.attrs.variant)}`);
  }

  return parts.length ? ` | ${parts.join(' | ')}` : '';
}

/**
 * Цитата: нативный редактируемый узел TipTap (можно кликнуть внутрь, добавлять
 * абзацы Enter'ом, мягкий перенос Shift+Enter'ом), но сериализуется/парсится через
 * `{@quote}`. Абзацы разделяются `{@br}{@br}` (граница), мягкий перенос — `{@br}`;
 * НИКАКИХ `\n` внутри маркера (бэкенд бьёт описание по `\n\n`). Штатный GFM-разбор
 * цитат (`> `) отключён (`parseMarkdown → []`) — источник только `{@quote}`.
 */
export const TtgQuote = Blockquote.extend({
  parseMarkdown: () => [],
  renderMarkdown: (node: JSONContent, helpers: MarkdownRendererHelpers) => {
    const paragraphs = (Array.isArray(node.content) ? node.content : []).map(
      (paragraph) => helpers.renderChildren([paragraph]),
    );

    return `{@quote ${paragraphs.join('{@br}{@br}')}${quoteAttrs(node)}}`;
  },
  markdownOptions: { indentsContent: false },
  addAttributes() {
    return {
      ...this.parent?.(),
      color: dataAttr('data-quote-color', 'color'),
      variant: dataAttr('data-quote-variant', 'variant'),
    };
  },
});

/**
 * Набор расширений для нативных цитат. Порядок: сперва markdown-хендлер
 * `{@quote}`, затем узел (как в ttgListExtensions/ttgTableExtensions).
 */
export const ttgQuoteExtensions = [TtgQuoteMarkdown, TtgQuote];
