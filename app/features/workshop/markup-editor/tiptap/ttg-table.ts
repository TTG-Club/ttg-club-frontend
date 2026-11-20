import type {
  JSONContent,
  MarkdownLexerConfiguration,
  MarkdownParseHelpers,
  MarkdownRendererHelpers,
  MarkdownToken,
} from '@tiptap/core';

import type { MarkerNode, RenderNode } from '~news/markup';

import type {
  DeferredBlockTokens,
  DeferredInlineTokens,
} from './block-tokenizer';

import { Extension } from '@tiptap/core';
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from '@tiptap/extension-table';

import {
  CELL_PLACEHOLDER,
  isBlockNode,
  isMarkerNode,
  parse,
  serializeInlineNodes,
} from '~news/markup';

import {
  createBlockMarkerTokenizer,
  deferBlock,
  deferInline,
  markerNameMatches,
} from './block-tokenizer';
import { dataAttr } from './node-utils';

const TABLE_TOKEN = 'ttgTable';

/** Имена табличного маркера (алиасов у {@table} нет). */
const TABLE_NAMES = new Set(['table']);

/** Структурная таблица, как её отдаёт parser.ts (buildTableNode). */
interface ParsedCell {
  content?: RenderNode[];
  align?: string;
}

interface ParsedTable extends MarkerNode {
  caption?: RenderNode | RenderNode[];
  colLabels?: RenderNode[];
  colStyles?: string[];
  colAligns?: string[];
  rows?: ParsedCell[][];
}

/**
 * Один сегмент содержимого ячейки. Ячейка обычно инлайновая (один сегмент →
 * абзац), но может содержать ВЛОЖЕННЫЙ блок ({@table}/{@list}/{@quote}/{@h}) —
 * тогда сегменты чередуются: инлайн-пробеги → абзацы, блочные узлы → нативные
 * редактируемые узлы. `block` выбирает, чем разбирать токены на фазе parseMarkdown
 * (`parseInline` → абзац vs `parseChildren` → блочный узел).
 */
interface CellSegment {
  block: boolean;
  tokens: DeferredInlineTokens | DeferredBlockTokens;
}

/** Разобранная ячейка редактора: упорядоченные сегменты содержимого + атрибуты. */
interface CellData {
  isHeader: boolean;
  segments: CellSegment[];
  style?: string;
  align?: string;
}

interface TableData {
  caption: string;
  cells: CellData[][]; // строки (первая — заголовок, если есть)
}

/**
 * Начинается ли строка ИМЕННО с `{@table` (а не `{@tablefoo}`). Экспортируется
 * для marks.ts, чтобы блочный токенайзер-чип пропускал таблицы к нативному узлу.
 */
export function isTableMarkerStart(source: string): boolean {
  return markerNameMatches(source, TABLE_NAMES);
}

function toArray(value: RenderNode | RenderNode[] | undefined): RenderNode[] {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

/**
 * Разбивает содержимое ячейки на сегменты: подряд идущие инлайн-узлы (текст,
 * форматирование, чипы) сливаются в инлайн-пробег (→ абзац), а блочные узлы
 * (вложенная таблица/список/цитата/заголовок) выделяются в отдельные сегменты
 * (→ нативный редактируемый узел). Так вложенная таблица грузится РЕДАКТИРУЕМОЙ,
 * а не «замерзает» атомарным чипом (инлайн-токенайзер превратил бы `{@table}` в
 * ttgMarker). Чистая инлайн-ячейка (обычный случай) даёт ровно один сегмент —
 * поведение таких таблиц не меняется.
 */
function buildCellSegments(
  content: RenderNode[],
  lexer: MarkdownLexerConfiguration,
): CellSegment[] {
  const segments: CellSegment[] = [];

  let inlineRun: RenderNode[] = [];

  const flushInline = (): void => {
    if (inlineRun.length) {
      segments.push({
        block: false,
        tokens: deferInline(lexer, serializeInlineNodes(inlineRun)),
      });

      inlineRun = [];
    }
  };

  for (const node of content) {
    if (isBlockNode(node)) {
      flushInline();

      // Блочный узел сериализуем ОТДЕЛЬНО (один `{@…}`-маркер без окружающего
      // текста), чтобы blockTokens вернул ровно один кастомный токен — его
      // parseChildren соберёт в нативный узел (рекурсивно для вложенных таблиц).
      segments.push({
        block: true,
        tokens: deferBlock(lexer, serializeInlineNodes([node])),
      });
    } else {
      inlineRun.push(node);
    }
  }

  flushInline();

  return segments;
}

/**
 * Разбирает сырой `{@table …}` в структуру ячеек с уже разобранными инлайн-
 * токенами. Возвращает undefined для пустой/битой таблицы (невалидный узел).
 */
function buildTableData(
  raw: string,
  lexer: MarkdownLexerConfiguration,
): TableData | undefined {
  const node = parse(raw).find(
    (candidate): candidate is ParsedTable =>
      isMarkerNode(candidate) && candidate.type === 'table',
  );

  if (!node) {
    return undefined;
  }

  const colLabels = node.colLabels ?? [];
  const colStyles = node.colStyles ?? [];
  const colAligns = node.colAligns ?? [];
  const bodyRows = node.rows ?? [];

  if (colLabels.length === 0 && bodyRows.length === 0) {
    return undefined;
  }

  const cells: CellData[][] = [];

  if (colLabels.length) {
    cells.push(
      colLabels.map((label, index) => ({
        isHeader: true,
        segments: buildCellSegments(toArray(label), lexer),
        style: colStyles[index] || undefined,
        align: colAligns[index] || undefined,
      })),
    );
  }

  for (const row of bodyRows) {
    cells.push(
      row.map((cell) => ({
        isHeader: false,
        segments: buildCellSegments(cell.content ?? [], lexer),
        align: cell.align,
      })),
    );
  }

  return { caption: serializeInlineNodes(toArray(node.caption)), cells };
}

/**
 * БЛОЧНЫЙ токенайзер `{@table …}` → нативный редактируемый узел таблицы (в отличие
 * от `ttgBlockMarker`, который делает атомарный чип). `blockMarkerMarkdownTokenizer`
 * таблицы намеренно пропускает (см. isTableMarkerStart).
 */
export const ttgTableMarkdownTokenizer = createBlockMarkerTokenizer(
  TABLE_TOKEN,
  isTableMarkerStart,
  buildTableData,
);

/**
 * Собирает JSON-содержимое ячейки из её сегментов: инлайн-пробег → абзац
 * (`parseInline`), блочный узел → нативный редактируемый узел (`parseChildren`
 * над блочными токенами — рекурсивно для вложенных таблиц). Ячейка обязана иметь
 * хотя бы один блочный узел (`content: 'block+'`), поэтому пустая → пустой абзац.
 */
function buildCellContent(
  cell: CellData,
  helpers: MarkdownParseHelpers,
): JSONContent[] {
  const content = cell.segments.flatMap((segment) =>
    segment.block
      ? helpers.parseChildren(segment.tokens())
      : [{ type: 'paragraph', content: helpers.parseInline(segment.tokens()) }],
  );

  return content.length ? content : [{ type: 'paragraph' }];
}

/**
 * Хендлер markdown для таблиц: токен `ttgTable` → нативный JSON
 * table > tableRow > (tableHeader|tableCell) > (paragraph|вложенный блок).
 * Отдельным расширением (а не на узле), т.к. один токен порождает всю структуру
 * таблицы.
 */
export const TtgTableMarkdown = Extension.create({
  name: 'ttgTableMarkdown',

  markdownTokenName: TABLE_TOKEN,
  markdownTokenizer: ttgTableMarkdownTokenizer,
  // Поля caption/cells кладёт в токен buildTableData (см. TableData). Читаем их
  // через typeof-проверку без каста — токен типизирован свободно.
  parseMarkdown: (token: MarkdownToken, helpers: MarkdownParseHelpers) => {
    const caption = typeof token.caption === 'string' ? token.caption : '';

    const cells: TableData['cells'] = Array.isArray(token.cells)
      ? token.cells
      : [];

    const rows = cells.map((row) =>
      helpers.createNode(
        'tableRow',
        {},
        row.map((cell) =>
          helpers.createNode(
            cell.isHeader ? 'tableHeader' : 'tableCell',
            { style: cell.style ?? null, align: cell.align ?? null },
            buildCellContent(cell, helpers),
          ),
        ),
      ),
    );

    return helpers.createNode('table', { caption }, rows);
  },
});

/**
 * Исходник содержимого ячейки: каждый блок (абзац, вложенная таблица/список/
 * цитата) рендерится в свой `{@…}`/текст, ТРИМится и склеивается одним пробелом.
 * Тримить блок ОБЯЗАТЕЛЬНО: хвостовой пробел абзаца плюс разделитель-пробел
 * иначе накапливались бы с каждым циклом save↔load (ячейка с вложенным блоком —
 * `outer {@table}` → `outer  {@table}` → …). После тримминга результат идемпотентен.
 */
function renderCellInline(
  node: JSONContent,
  helpers: MarkdownRendererHelpers,
): string {
  const blocks = Array.isArray(node.content) ? node.content : [];

  return blocks
    .map((block) => helpers.renderChildren([block]).trim())
    .filter((part) => part.length > 0)
    .join(' ');
}

/**
 * Таблица: нативный редактируемый узел TipTap (вставка/строки/колонки), но
 * сериализуется/парсится через `{@table}`. Штатный GFM-парсер (`| a | b |`)
 * отключён (`parseMarkdown → []`) — источник таблиц только `{@table}`.
 */
export const TtgTable = Table.extend({
  parseMarkdown: () => [],
  renderMarkdown: (node: JSONContent, helpers: MarkdownRendererHelpers) => {
    const rows = helpers.renderChildren(
      Array.isArray(node.content) ? node.content : [],
    );

    const caption = node.attrs?.caption
      ? `{@caption ${String(node.attrs.caption)}}`
      : '';

    return `{@table ${caption}${rows}}`;
  },
  markdownOptions: { indentsContent: false },
  addAttributes() {
    return {
      ...this.parent?.(),
      caption: {
        default: '',
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-caption') ?? '',
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.caption
            ? { 'data-caption': String(attributes.caption) }
            : {},
      },
    };
  },
});

export const TtgTableRow = TableRow.extend({
  parseMarkdown: () => [],
  renderMarkdown: (node: JSONContent, helpers: MarkdownRendererHelpers) =>
    `{@tr ${helpers.renderChildren(Array.isArray(node.content) ? node.content : [])}}`,
  markdownOptions: { indentsContent: false },
});

export const TtgTableHeader = TableHeader.extend({
  parseMarkdown: () => [],
  renderMarkdown: (node: JSONContent, helpers: MarkdownRendererHelpers) => {
    const style = node.attrs?.style
      ? ` | style:${String(node.attrs.style)}`
      : '';

    const align = node.attrs?.align
      ? ` | align:${String(node.attrs.align)}`
      : '';

    return `{@th ${renderCellInline(node, helpers) || CELL_PLACEHOLDER}${style}${align}}`;
  },
  markdownOptions: { indentsContent: false },
  addAttributes() {
    return {
      ...this.parent?.(),
      style: dataAttr('data-col-style', 'style'),
      align: dataAttr('data-align', 'align'),
    };
  },
});

export const TtgTableCell = TableCell.extend({
  parseMarkdown: () => [],
  renderMarkdown: (node: JSONContent, helpers: MarkdownRendererHelpers) => {
    const align = node.attrs?.align
      ? ` | align:${String(node.attrs.align)}`
      : '';

    return `{@td ${renderCellInline(node, helpers) || CELL_PLACEHOLDER}${align}}`;
  },
  markdownOptions: { indentsContent: false },
  addAttributes() {
    return { ...this.parent?.(), align: dataAttr('data-align', 'align') };
  },
});

/**
 * Набор расширений для нативных таблиц. Порядок: сперва markdown-хендлер
 * `{@table}`, затем узлы (как в ttgListExtensions).
 */
export const ttgTableExtensions = [
  TtgTableMarkdown,
  TtgTable,
  TtgTableRow,
  TtgTableCell,
  TtgTableHeader,
];
