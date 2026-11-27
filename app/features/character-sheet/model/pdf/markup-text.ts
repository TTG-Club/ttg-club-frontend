import type {
  ContentDescription,
  ContentElementNode,
  ContentNode,
} from '~content/model';
import type { MarkerNode, RenderNode } from '~news/markup';

import type { PdfTextBlock, PdfTextRun, PdfTextStyle } from './types';

import { parseContent } from '~content/model';
import {
  clampHeadingLevel,
  isBlockNode,
  isMarkerNode,
  parse,
  parseStoredMarkup,
} from '~news/markup';

import { PDF_NOTE_SEPARATOR } from './constants';

/** Теги HTML старой базы, переключающие начертание фрагмента. */
const HTML_STYLE_TAGS: Record<string, PdfTextStyle> = {
  b: 'bold',
  strong: 'bold',
  i: 'italic',
  em: 'italic',
  cite: 'italic',
};

/** Теги заголовков HTML и уровень заголовка в PDF. */
const HTML_HEADING_LEVELS: Record<string, number> = {
  h1: 1,
  h2: 1,
  h3: 2,
  h4: 3,
  h5: 4,
  h6: 4,
};

/** Блочные теги HTML: идущий подряд строчный текст закрывается абзацем. */
const HTML_BLOCK_TAGS: ReadonlySet<string> = new Set([
  'p',
  'div',
  'section',
  'article',
  'blockquote',
  'ul',
  'ol',
  'li',
  'table',
  'hr',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
]);

/**
 * Табличный узел разметки. Таблица держит строки и подписи столбцов рядом с
 * `content`, а базовый `MarkerNode` этих полей не описывает — их вид знает
 * только рендер таблицы, поэтому здесь они читаются как `unknown`.
 */
interface MarkupTableNode extends MarkerNode {
  colLabels?: unknown[];
  rows?: unknown[][];
}

/** Типы маркеров, переключающих начертание фрагмента. */
const MARKER_STYLES: Record<string, PdfTextStyle> = {
  bold: 'bold',
  italic: 'italic',
};

/**
 * Таблица ли это: поля строк лежат вне описанного `MarkerNode`, поэтому доступ
 * к ним открывает предикат, а не приведение типа.
 *
 * @param node узел разметки.
 * @returns true — узел является таблицей.
 */
function isTableNode(node: MarkerNode): node is MarkupTableNode {
  return node.type === 'table';
}

/**
 * Текст произвольного значения разметки: строки, числа, узлы с `text` или
 * `content`, ячейки таблицы (`{ content, align }`) и массивы всего этого.
 *
 * @param value значение неизвестной формы.
 * @returns плоский текст значения.
 */
function getUnknownText(value: unknown): string {
  // Ячейка — тоже разметка: маркеры в ней сводятся к своим подписям.
  if (typeof value === 'string') {
    return toStringRuns(value, 'regular')
      .map((run) => run.text)
      .join('');
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => getUnknownText(item)).join('');
  }

  if (typeof value !== 'object' || value === null) {
    return '';
  }

  if ('text' in value) {
    return getUnknownText(value.text);
  }

  if ('content' in value) {
    return getUnknownText(value.content);
  }

  return '';
}

/**
 * Подпись маркера броска: у `{@dice}` формула лежит в содержимом, а
 * пользовательская подпись — в атрибуте `text`; в PDF бросать нечего, поэтому
 * подпись важнее формулы.
 *
 * @param node узел маркера.
 * @returns подпись из атрибута или пустая строка.
 */
function getRollLabel(node: MarkerNode): string {
  const label = node.attrs?.text;

  return typeof label === 'string' ? label : '';
}

/**
 * Фрагменты строки разметки. Строки с маркерами встречаются не только на верхнем
 * уровне описания, но и внутри узлов — в пунктах списка, ячейках, цитатах; сайт
 * разбирает их на любой глубине, и PDF должен так же, иначе `{@b …}` и
 * `{@glossary …}` печатались бы как есть.
 *
 * @param text строка разметки.
 * @param style начертание, действующее на этом уровне.
 * @returns фрагменты текста.
 */
function toStringRuns(text: string, style: PdfTextStyle): PdfTextRun[] {
  const parsed = parse(text);

  // Строка без маркеров разбирается сама в себя — дальше разбирать нечего.
  if (parsed.length === 1 && parsed[0] === text) {
    return [{ text, style }];
  }

  return parsed.flatMap((child) =>
    typeof child === 'string'
      ? [{ text: child, style }]
      : toTextRuns(child, style),
  );
}

/**
 * Фрагменты текста узла с сохранением начертания. Инлайновые маркеры (ссылки,
 * чипы разделов, бейджи) отдают свою подпись обычным текстом — в PDF им незачем
 * быть ссылками.
 *
 * @param node узел разметки или массив узлов.
 * @param style начертание, действующее на этом уровне.
 * @returns фрагменты текста.
 */
function toTextRuns(
  node: RenderNode | RenderNode[],
  style: PdfTextStyle,
): PdfTextRun[] {
  if (typeof node === 'string') {
    return toStringRuns(node, style);
  }

  if (Array.isArray(node)) {
    return node.flatMap((child) => toTextRuns(child, style));
  }

  if (!isMarkerNode(node)) {
    return [{ text: node.text, style }];
  }

  if (node.type === 'break') {
    return [{ text: '\n', style }];
  }

  if (node.type === 'roll') {
    const label = getRollLabel(node);

    if (label) {
      return [{ text: label, style }];
    }
  }

  if (!node.content?.length) {
    return [];
  }

  const nestedStyle = MARKER_STYLES[node.type] ?? style;

  return node.content.flatMap((child) => toTextRuns(child, nestedStyle));
}

/**
 * Есть ли во фрагментах непробельный текст.
 *
 * @param runs фрагменты текста.
 * @returns true — блок стоит рисовать.
 */
function hasVisibleText(runs: PdfTextRun[]): boolean {
  return runs.some((run) => run.text.trim());
}

/**
 * Пустой блок заданного вида.
 *
 * @param kind вид блока.
 * @param runs фрагменты текста блока.
 * @param level уровень вложенности или заголовка.
 * @returns блок описания.
 */
function createBlock(
  kind: PdfTextBlock['kind'],
  runs: PdfTextRun[],
  level = 1,
): PdfTextBlock {
  return { kind, runs, rows: [], level };
}

/**
 * Строки таблицы: подписи столбцов идут первой строкой, дальше — данные.
 *
 * @param node табличный узел.
 * @returns строки таблицы по ячейкам.
 */
function toTableRows(node: MarkupTableNode): string[][] {
  const rows = (node.rows ?? []).map((row) =>
    row.map((cell) => getUnknownText(cell).trim()),
  );

  const labels = (node.colLabels ?? []).map((label) =>
    getUnknownText(label).trim(),
  );

  return labels.some((label) => label) ? [labels, ...rows] : rows;
}

/**
 * Элементы списка в блоки. Вложенный список внутри пункта уходит на уровень
 * глубже, остальное содержимое пункта становится его текстом.
 *
 * @param node узел списка.
 * @param level уровень вложенности (с единицы).
 * @returns блоки пунктов списка.
 */
function toListBlocks(node: MarkerNode, level: number): PdfTextBlock[] {
  const blocks: PdfTextBlock[] = [];

  for (const item of node.content ?? []) {
    // Пробелы и переводы строк между пунктами приходят отдельными текстовыми
    // узлами: без этой проверки каждый такой узел рисовал бы пустой маркер.
    if (!isMarkerNode(item)) {
      const runs = toTextRuns(item, 'regular');

      if (hasVisibleText(runs)) {
        blocks.push(createBlock('listItem', runs, level));
      }

      continue;
    }

    const runs: PdfTextRun[] = [];
    const nested: PdfTextBlock[] = [];

    for (const child of item.content ?? []) {
      if (isMarkerNode(child) && child.type === 'list') {
        nested.push(...toListBlocks(child, level + 1));

        continue;
      }

      runs.push(...toTextRuns(child, 'regular'));
    }

    if (hasVisibleText(runs)) {
      blocks.push(createBlock('listItem', runs, level));
    }

    blocks.push(...nested);
  }

  return blocks;
}

/**
 * Блочный узел разметки в блоки описания.
 *
 * @param node блочный узел.
 * @returns блоки описания.
 */
function toBlocksFromBlockNode(node: MarkerNode): PdfTextBlock[] {
  if (node.type === 'separator') {
    return [createBlock('separator', [])];
  }

  if (node.type === 'heading') {
    return [
      createBlock(
        'heading',
        toTextRuns(node.content ?? [], 'bold'),
        clampHeadingLevel(node.attrs?.level),
      ),
    ];
  }

  if (node.type === 'quote') {
    return [createBlock('quote', toTextRuns(node.content ?? [], 'italic'))];
  }

  if (node.type === 'list') {
    return toListBlocks(node, 1);
  }

  if (node.type === 'li') {
    return [createBlock('listItem', toTextRuns(node.content ?? [], 'regular'))];
  }

  if (isTableNode(node)) {
    const rows = toTableRows(node);

    return rows.length ? [{ kind: 'table', runs: [], rows, level: 1 }] : [];
  }

  return [createBlock('paragraph', toTextRuns(node.content ?? [], 'regular'))];
}

/**
 * Описание из разметки сайта в блоки для PDF. Строки верхнего уровня разбираются
 * парсером разметки, блочные маркеры выносятся отдельными блоками, а идущие
 * подряд текст и инлайновые маркеры собираются в абзац — тем же порядком, каким
 * описание рисуется на сайте.
 *
 * @param nodes узлы описания из документа персонажа.
 * @returns блоки описания, готовые к отрисовке в потоке.
 */
export function toPdfTextBlocks(
  nodes: ReadonlyArray<RenderNode>,
): PdfTextBlock[] {
  const blocks: PdfTextBlock[] = [];

  for (const entry of nodes) {
    const parsedNodes: RenderNode[] =
      typeof entry === 'string' ? parse(entry) : [entry];

    let inlineRuns: PdfTextRun[] = [];

    /** Закрывает набранный абзац из инлайновых фрагментов. */
    const flushInline = (): void => {
      if (hasVisibleText(inlineRuns)) {
        blocks.push(createBlock('paragraph', inlineRuns));
      }

      inlineRuns = [];
    };

    for (const node of parsedNodes) {
      if (isMarkerNode(node) && isBlockNode(node)) {
        flushInline();
        blocks.push(...toBlocksFromBlockNode(node));

        continue;
      }

      inlineRuns.push(...toTextRuns(node, 'regular'));
    }

    flushInline();
  }

  return blocks;
}

/**
 * Блок-заголовок для текста, которого нет в разметке (например, название
 * заметки над её содержимым).
 *
 * @param text текст заголовка.
 * @returns блок заголовка, готовый к отрисовке в потоке.
 */
export function toPdfHeadingBlock(text: string): PdfTextBlock {
  return createBlock('heading', [{ text, style: 'bold' }]);
}

/**
 * Плоский текст описания одной строкой — для мест, где на абзацы места нет
 * (подпись особенности в списке первой страницы).
 *
 * @param nodes узлы описания.
 * @returns описание одной строкой.
 */
export function toPdfPlainText(nodes: ReadonlyArray<RenderNode>): string {
  return toPdfTextBlocks(nodes)
    .flatMap((block) =>
      block.kind === 'table'
        ? block.rows.map((row) => row.join(PDF_NOTE_SEPARATOR))
        : [block.runs.map((run) => run.text).join('')],
    )
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(' ');
}

/**
 * Фрагменты текста узлов HTML с сохранением начертания: ссылки и подсказки
 * сущностей отдают свою подпись обычным текстом.
 *
 * @param nodes узлы HTML.
 * @param style начертание, действующее на этом уровне.
 * @returns фрагменты текста.
 */
function toHtmlRuns(
  nodes: ReadonlyArray<ContentNode>,
  style: PdfTextStyle,
): PdfTextRun[] {
  return nodes.flatMap((node): PdfTextRun[] => {
    if (node.kind === 'text') {
      return [{ text: node.text, style }];
    }

    if (node.tag === 'br') {
      return [{ text: '\n', style }];
    }

    return toHtmlRuns(node.children, HTML_STYLE_TAGS[node.tag] ?? style);
  });
}

/**
 * Плоский текст узлов HTML — для ячеек таблицы.
 *
 * @param nodes узлы HTML.
 * @returns текст без разметки.
 */
function getHtmlText(nodes: ReadonlyArray<ContentNode>): string {
  return toHtmlRuns(nodes, 'regular')
    .map((run) => run.text)
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Строки таблицы HTML по ячейкам: секции `thead`/`tbody` разворачиваются,
 * строка заголовка остаётся первой — как и в таблице разметки.
 *
 * @param nodes дочерние узлы таблицы.
 * @returns строки таблицы.
 */
function toHtmlTableRows(nodes: ReadonlyArray<ContentNode>): string[][] {
  return nodes.flatMap((node): string[][] => {
    if (node.kind !== 'element') {
      return [];
    }

    if (node.tag === 'tr') {
      return [
        node.children.flatMap((cell) =>
          cell.kind === 'element' && (cell.tag === 'td' || cell.tag === 'th')
            ? [getHtmlText(cell.children)]
            : [],
        ),
      ];
    }

    return toHtmlTableRows(node.children);
  });
}

/**
 * Вложенный ли это список HTML.
 *
 * @param node узел HTML.
 * @returns true — узел `ul` или `ol`.
 */
function isHtmlList(node: ContentNode): boolean {
  return node.kind === 'element' && (node.tag === 'ul' || node.tag === 'ol');
}

/**
 * Список HTML в блоки: вложенный список уходит на уровень глубже.
 *
 * @param nodes пункты списка.
 * @param level уровень вложенности (с единицы).
 * @returns блоки пунктов.
 */
function toHtmlListBlocks(
  nodes: ReadonlyArray<ContentNode>,
  level: number,
): PdfTextBlock[] {
  return nodes.flatMap((item): PdfTextBlock[] => {
    if (item.kind !== 'element' || item.tag !== 'li') {
      return [];
    }

    const nested = item.children.flatMap((child) =>
      child.kind === 'element' && isHtmlList(child)
        ? toHtmlListBlocks(child.children, level + 1)
        : [],
    );

    const runs = toHtmlRuns(
      item.children.filter((child) => !isHtmlList(child)),
      'regular',
    );

    return [
      ...(hasVisibleText(runs) ? [createBlock('listItem', runs, level)] : []),
      ...nested,
    ];
  });
}

/**
 * Блочный элемент HTML в блоки описания.
 *
 * @param node блочный элемент.
 * @returns блоки описания.
 */
function toHtmlElementBlocks(node: ContentElementNode): PdfTextBlock[] {
  const headingLevel = HTML_HEADING_LEVELS[node.tag];

  if (headingLevel) {
    return [
      createBlock('heading', toHtmlRuns(node.children, 'bold'), headingLevel),
    ];
  }

  if (node.tag === 'hr') {
    return [createBlock('separator', [])];
  }

  if (node.tag === 'blockquote') {
    return [createBlock('quote', toHtmlRuns(node.children, 'italic'))];
  }

  if (isHtmlList(node)) {
    return toHtmlListBlocks(node.children, 1);
  }

  if (node.tag === 'li') {
    return toHtmlListBlocks([node], 1);
  }

  if (node.tag === 'table') {
    const rows = toHtmlTableRows(node.children);

    return rows.length ? [{ kind: 'table', runs: [], rows, level: 1 }] : [];
  }

  // Абзац и контейнеры: внутри могут быть и свои блоки.
  return toHtmlBlocks(node.children);
}

/**
 * Узлы HTML старой базы в блоки описания: абзацы, заголовки, списки, цитаты,
 * таблицы и разделители, как их рисует сайт; строчный текст между блоками
 * собирается в абзац.
 *
 * @param nodes узлы HTML.
 * @returns блоки описания.
 */
function toHtmlBlocks(nodes: ReadonlyArray<ContentNode>): PdfTextBlock[] {
  const blocks: PdfTextBlock[] = [];

  let inlineRuns: PdfTextRun[] = [];

  /** Закрывает набранный абзац из строчных фрагментов. */
  const flushInline = (): void => {
    if (hasVisibleText(inlineRuns)) {
      blocks.push(createBlock('paragraph', inlineRuns));
    }

    inlineRuns = [];
  };

  for (const node of nodes) {
    if (node.kind === 'text' || !HTML_BLOCK_TAGS.has(node.tag)) {
      inlineRuns.push(...toHtmlRuns([node], 'regular'));

      continue;
    }

    flushInline();
    blocks.push(...toHtmlElementBlocks(node));
  }

  flushInline();

  return blocks;
}

/**
 * Описание записи справочника в блоки для PDF. У старой базы описание —
 * HTML-строка, у новой — массив блоков разметки (или JSON-строка с ним).
 *
 * @param description описание из ответа API или из документа листа.
 * @returns блоки описания; пусто — описания нет.
 */
export function toPdfDescriptionBlocks(
  description: ContentDescription | null | undefined,
): PdfTextBlock[] {
  if (!description) {
    return [];
  }

  if (Array.isArray(description)) {
    return toPdfTextBlocks(description);
  }

  const stored = parseStoredMarkup(description);

  if (Array.isArray(stored)) {
    return toPdfTextBlocks(stored);
  }

  return toHtmlBlocks(parseContent(description));
}
