import type {
  JSONContent,
  MarkdownLexerConfiguration,
  MarkdownParseHelpers,
  MarkdownRendererHelpers,
  MarkdownToken,
  MarkdownTokenizer,
} from '@tiptap/core';

import type { MarkerNode, RenderNode } from '~news/markup';

import type { DeferredInlineTokens } from './block-tokenizer';

import { Extension } from '@tiptap/core';
import { BulletList, ListItem, OrderedList } from '@tiptap/extension-list';

import {
  isMarkerNode,
  parse,
  serializeInlineNodes,
  serializeMarkup,
} from '~news/markup';

import {
  createBlockMarkerTokenizer,
  deferInline,
  markerNameMatches,
} from './block-tokenizer';

/** Префикс списочного маркера (для сериализации в `{@list …}`). */
const LIST_PREFIX = '{@list';

/** Токен, которым внутренний токенайзер отдаёт разобранный {@list ...}. */
const LIST_TOKEN = 'ttgList';

/** Имена списочного маркера (алиасов у {@list} нет). */
const LIST_NAMES = new Set(['list']);

/** Разобранный пункт списка: ленивые инлайн-токены абзаца + вложенные списки. */
interface TtgListItemData {
  /** Ленивые инлайн-токены содержимого пункта (→ узлы абзаца через parseInline). */
  tokens: DeferredInlineTokens;
  /** Вложенные списки, прикреплённые к этому пункту (как в MarkupList). */
  children: TtgListData[];
}

/** Разобранный список: тип нумерации + пункты. */
interface TtgListData {
  ordered: boolean;
  items: TtgListItemData[];
}

/**
 * Начинается ли строка ИМЕННО со списочного маркера `{@list` (а не, например,
 * `{@listfoo}`). После `{@list` допустим только пробел (есть тело) или `}`
 * (пустой маркер). Нужно, чтобы токенайзер списка не перехватывал чужие маркеры.
 */
export function isListMarkerStart(source: string): boolean {
  return markerNameMatches(source, LIST_NAMES);
}

/** Исходник содержимого одного пункта списка (для инлайн-токенизации). */
function itemInner(child: RenderNode): string {
  if (isMarkerNode(child)) {
    return serializeInlineNodes(child.content ?? []);
  }

  if (Array.isArray(child)) {
    return serializeInlineNodes(child);
  }

  return serializeMarkup(child);
}

/**
 * Преобразует разобранный узел-список разметки (`{@list}`) в структуру токена:
 * тип нумерации и пункты с уже разобранными инлайн-токенами. Вложенный `{@list}`
 * стоит в контенте СИБЛИНГОМ (как в строковом формате и MarkupList) — цепляем
 * его к предыдущему пункту.
 */
function listNodeToData(
  node: MarkerNode,
  lexer: MarkdownLexerConfiguration,
): TtgListData {
  const ordered = node.attrs?.type === 'ordered';
  const items: TtgListItemData[] = [];

  for (const child of node.content ?? []) {
    // Вложенный список — сиблинг в контенте: цепляем к предыдущему пункту.
    if (isMarkerNode(child) && child.type === 'list') {
      const nested = listNodeToData(child, lexer);
      const last = items.at(-1);

      if (last) {
        last.children.push(nested);
      } else {
        items.push({ tokens: () => [], children: [nested] });
      }

      continue;
    }

    // Пункт {@li ...} (или батч-массив из бэкенд-AST) — один <li>.
    items.push({
      tokens: deferInline(lexer, itemInner(child)),
      children: [],
    });
  }

  return { ordered, items };
}

/**
 * Разбирает сырой `{@list ...}` в структуру списка. Возвращает undefined, если
 * это не список или в нём нет пунктов (пустой список — невалидный узел схемы).
 */
function buildListData(
  raw: string,
  lexer: MarkdownLexerConfiguration,
): TtgListData | undefined {
  const listNode = parse(raw).find(
    (node) => isMarkerNode(node) && node.type === 'list',
  );

  if (!listNode || !isMarkerNode(listNode)) {
    return undefined;
  }

  const data = listNodeToData(listNode, lexer);

  return data.items.length > 0 ? data : undefined;
}

/**
 * БЛОЧНЫЙ токенайзер markdown для `{@list ...}`. В отличие от `ttgBlockMarker`
 * (атомарный чип), список становится НАТИВНЫМ редактируемым узлом TipTap
 * (bulletList/orderedList > listItem). Отдаёт токен `ttgList` с уже разобранной
 * структурой; `blockMarkerMarkdownTokenizer` списки намеренно пропускает.
 */
export const ttgListMarkdownTokenizer = createBlockMarkerTokenizer(
  LIST_TOKEN,
  isListMarkerStart,
  buildListData,
);

/** Строит JSON пункта списка: абзац из инлайн-токенов + вложенные списки. */
function listItemToJSON(
  item: TtgListItemData,
  helpers: MarkdownParseHelpers,
): JSONContent {
  const paragraph: JSONContent = {
    type: 'paragraph',
    content: helpers.parseInline(item.tokens()),
  };

  return {
    type: 'listItem',
    content: [
      paragraph,
      ...item.children.map((child) => listDataToJSON(child, helpers)),
    ],
  };
}

/** Строит JSON списка (bulletList/orderedList) из разобранной структуры. */
function listDataToJSON(
  data: TtgListData,
  helpers: MarkdownParseHelpers,
): JSONContent {
  return {
    type: data.ordered ? 'orderedList' : 'bulletList',
    content: data.items.map((item) => listItemToJSON(item, helpers)),
  };
}

/**
 * Расширение-хендлер markdown для списков: регистрирует блочный токенайзер
 * `{@list}` и разбор токена `ttgList` в нативные узлы. Отдельным расширением
 * (а не на узле) — потому что один токен порождает bulletList ИЛИ orderedList.
 */
export const TtgListMarkdown = Extension.create({
  name: 'ttgListMarkdown',

  markdownTokenName: LIST_TOKEN,
  markdownTokenizer: ttgListMarkdownTokenizer,
  // Поля ordered/items кладёт в токен listNodeToData (см. TtgListData). `items`
  // объявлено в MarkdownToken как MarkdownToken[], поэтому читаем его через
  // unknown (без каста) и сужаем Array.isArray — так своя структура не конфликтует
  // с базовым типом токена.
  parseMarkdown: (token: MarkdownToken, helpers: MarkdownParseHelpers) => {
    const rawItems: unknown = token.items;
    const items: TtgListItemData[] = Array.isArray(rawItems) ? rawItems : [];

    return listDataToJSON({ ordered: token.ordered === true, items }, helpers);
  },
});

/** Сериализует нативный список в `{@list {@li ...}...[ | type:ordered]}`. */
function renderList(
  node: JSONContent,
  helpers: MarkdownRendererHelpers,
  ordered: boolean,
): string {
  const content = Array.isArray(node.content) ? node.content : [];
  const body = helpers.renderChildren(content);
  const attrs = ordered ? ' | type:ordered' : '';

  return `${LIST_PREFIX} ${body}${attrs}}`;
}

/**
 * Сериализует нативный пункт списка в `{@li <абзац>}`. Вложенные списки —
 * СИБЛИНГИ после `{@li}` (строковый формат хранит их так; MarkupList затем
 * цепляет вложенный список к предыдущему пункту).
 */
function renderListItem(
  node: JSONContent,
  helpers: MarkdownRendererHelpers,
): string {
  const content = Array.isArray(node.content) ? node.content : [];
  const [paragraph, ...rest] = content;

  const inline = paragraph ? helpers.renderChildren([paragraph]) : '';

  let output = `{@li ${inline}}`;

  for (const child of rest) {
    if (child.type === 'bulletList' || child.type === 'orderedList') {
      output += helpers.renderChildren([child]);
    }
  }

  return output;
}

/**
 * Никогда не срабатывающий токенайзер — им ГАСИМ штатный `1.`-парсер
 * OrderedList (он превращал любую строку «N. текст» в список). Разметка чисто
 * `{@...}`, списки приходят ТОЛЬКО через `{@list}` (см. ttgListMarkdownTokenizer).
 */
const NOOP_TOKENIZER: MarkdownTokenizer = {
  name: 'ttgOrderedListDisabled',
  level: 'block',
  start: () => -1,
  tokenize: () => undefined,
};

/**
 * Маркированный список: нативный узел TipTap (Tab — вложить, Shift+Tab —
 * поднять, Enter — новый пункт), но сериализуется/парсится через `{@list}`.
 * Штатный markdown-разбор списков отключён (`parseMarkdown → []`), чтобы «- »
 * из текста НЕ превращалось в список — источник списков только `{@list}`.
 */
export const TtgBulletList = BulletList.extend({
  parseMarkdown: () => [],
  renderMarkdown: (node: JSONContent, helpers: MarkdownRendererHelpers) =>
    renderList(node, helpers, false),
  markdownOptions: { indentsContent: false },
});

/** Нумерованный список: как TtgBulletList, но `| type:ordered`. */
export const TtgOrderedList = OrderedList.extend({
  parseMarkdown: () => [],
  renderMarkdown: (node: JSONContent, helpers: MarkdownRendererHelpers) =>
    renderList(node, helpers, true),
  markdownOptions: { indentsContent: false },
  markdownTokenizer: NOOP_TOKENIZER,
});

/** Пункт списка: нативный узел, сериализуется в `{@li ...}` (+ вложенные списки). */
export const TtgListItem = ListItem.extend({
  parseMarkdown: () => [],
  renderMarkdown: (node: JSONContent, helpers: MarkdownRendererHelpers) =>
    renderListItem(node, helpers),
  markdownOptions: { indentsContent: false },
});

/**
 * Набор расширений для нативных списков. Порядок: сперва markdown-хендлер
 * `{@list}`, затем узлы. ListKeymap (Backspace/Delete в списках) уже даёт
 * StarterKit — он активируется, как только `listItem` появляется в схеме.
 */
export const ttgListExtensions = [
  TtgListMarkdown,
  TtgBulletList,
  TtgOrderedList,
  TtgListItem,
];
