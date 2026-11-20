import type {
  JSONContent,
  MarkdownLexerConfiguration,
  MarkdownParseHelpers,
  MarkdownRendererHelpers,
  MarkdownToken,
} from '@tiptap/core';

import type { MarkerNode } from '~news/markup';

import type { DeferredInlineTokens } from './block-tokenizer';

import { Extension } from '@tiptap/core';
import { Heading } from '@tiptap/extension-heading';

import {
  clampHeadingLevel,
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

const HEADING_TOKEN = 'ttgHeading';

/** Имена маркера заголовка (алиас `h` из markup/config.ts). */
const HEADING_NAMES = new Set(['h', 'heading']);

/** Пользовательские уровни заголовка, доступные в редакторе (1 — крупный … 4). */
export const HEADING_LEVELS = [1, 2, 3, 4] as const;

/** Разобранный заголовок: уровень, выравнивание и ленивые инлайн-токены. */
interface HeadingData {
  level: number;
  align?: string;
  inline: DeferredInlineTokens;
}

/**
 * Начинается ли строка ИМЕННО с маркера заголовка (`{@h`). Экспортируется для
 * marks.ts, чтобы блочный чип-токенайзер пропускал заголовок к нативному узлу
 * (как списки/таблицы/цитаты).
 */
export function isHeadingMarkerStart(source: string): boolean {
  return markerNameMatches(source, HEADING_NAMES);
}

/**
 * Разбирает сырой `{@h …}` в структуру: уровень (1–4), выравнивание и уже
 * разобранные инлайн-токены содержимого. undefined — если это не заголовок.
 */
function buildHeadingData(
  raw: string,
  lexer: MarkdownLexerConfiguration,
): HeadingData | undefined {
  const node = parse(raw).find(
    (candidate): candidate is MarkerNode =>
      isMarkerNode(candidate) && candidate.type === 'heading',
  );

  if (!node) {
    return undefined;
  }

  return {
    level: clampHeadingLevel(node.attrs?.level),
    align: typeof node.attrs?.align === 'string' ? node.attrs.align : undefined,
    inline: deferInline(lexer, serializeInlineNodes(node.content ?? [])),
  };
}

/**
 * БЛОЧНЫЙ токенайзер `{@h …}` → нативный редактируемый заголовок TipTap (в отличие
 * от `ttgBlockMarker`, который делал атомарный НЕредактируемый чип). Именно поэтому
 * заголовок теперь можно выделять, править текст, менять уровень и удалять.
 */
export const ttgHeadingMarkdownTokenizer = createBlockMarkerTokenizer(
  HEADING_TOKEN,
  isHeadingMarkerStart,
  buildHeadingData,
);

/**
 * Хендлер markdown для заголовков: токен `ttgHeading` → нативный узел heading с
 * уровнем/выравниванием. Отдельным расширением (а не на узле), как у списков/
 * таблиц/цитат.
 */
export const TtgHeadingMarkdown = Extension.create({
  name: 'ttgHeadingMarkdown',

  markdownTokenName: HEADING_TOKEN,
  markdownTokenizer: ttgHeadingMarkdownTokenizer,
  // Поля level/align/inline кладёт в токен buildHeadingData (см. HeadingData).
  // Читаем их через typeof-проверку без каста — токен типизирован свободно.
  parseMarkdown: (token: MarkdownToken, helpers: MarkdownParseHelpers) => {
    const level = typeof token.level === 'number' ? token.level : 1;
    const align = typeof token.align === 'string' ? token.align : null;

    const inline: MarkdownToken[] =
      typeof token.inline === 'function' ? token.inline() : [];

    return helpers.createNode(
      'heading',
      { level, align },
      helpers.parseInline(inline),
    );
  },
});

/**
 * Заголовок: нативный редактируемый узел TipTap (можно кликнуть внутрь, выделять,
 * менять уровень командой setHeading/toggleHeading), но сериализуется/парсится
 * через `{@h … | level:N}`. Штатный ATX-разбор Markdown (`# `) отключён
 * (`parseMarkdown → []`) — источник заголовков только `{@h}`.
 */
export const TtgHeading = Heading.extend({
  parseMarkdown: () => [],
  renderMarkdown: (node: JSONContent, helpers: MarkdownRendererHelpers) => {
    const content = Array.isArray(node.content) ? node.content : [];
    const level = clampHeadingLevel(node.attrs?.level);
    const align = node.attrs?.align;

    const alignAttr =
      align === 'center' || align === 'right' ? ` | align:${align}` : '';

    return `{@h ${helpers.renderChildren(content)} | level:${level}${alignAttr}}`;
  },
  markdownOptions: { indentsContent: false },
  addAttributes() {
    return {
      ...this.parent?.(),
      align: dataAttr('data-align', 'align'),
    };
  },
  // Пользовательские уровни 1–4 (1 — крупный … 4 — минимальный), как MarkupHeading
  // на странице. `configure` вместо override addOptions — не ломает тип HeadingOptions.
}).configure({ levels: [...HEADING_LEVELS] });

/**
 * Набор расширений для нативных заголовков. Порядок: сперва markdown-хендлер
 * `{@h}`, затем узел (как в ttgListExtensions/ttgQuoteExtensions).
 */
export const ttgHeadingExtensions = [TtgHeadingMarkdown, TtgHeading];
