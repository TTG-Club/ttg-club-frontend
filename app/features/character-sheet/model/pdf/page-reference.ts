import type { PDFPage } from 'pdf-lib';

import type { SpellDetail } from '~character/model';

import type { SheetItem, SheetSpell } from '../schema';
import type { PdfFeatureRow } from './data';
import type {
  PdfBuildContext,
  PdfFlow,
  PdfRect,
  PdfSheet,
  PdfTextBlock,
  PdfTextRun,
} from './types';

import { SPELL_TEXT } from '~character/model';

import { SPELL_STAT_KEYS, SPELL_STAT_LABELS } from '../constants';
import { getComponentsText } from '../spells';
import {
  PDF_COLORS,
  PDF_CONTENT_BOTTOM,
  PDF_CONTENT_WIDTH,
  PDF_CONTINUED_SUFFIX,
  PDF_ELLIPSIS,
  PDF_LINE_HEIGHT_RATIO,
  PDF_LINE_WIDTH,
  PDF_NOTE_SEPARATOR,
  PDF_PAGE_HEIGHT,
  PDF_PAGE_MARGIN,
  PDF_REFERENCE_CARD,
  PDF_REFERENCE_SECTIONS,
  PDF_SPELL_LABELS,
  PDF_TITLE_LETTER_SPACING_RATIO,
  PDF_TITLES,
} from './constants';
import {
  getPdfFeatureRows,
  getPdfInventoryGroups,
  getPdfSpellGroups,
} from './data';
import {
  createPdfFlow,
  drawRule,
  drawSectionHeader,
  drawTextBlocks,
  drawTextLine,
  getTextWidth,
  truncateText,
  wrapPlainText,
} from './layout';
import { toPdfDescriptionBlocks, toPdfTextBlocks } from './markup-text';

/** Абзацы своего текста: блоки разделены пустой строкой. */
const PARAGRAPH_SEPARATOR = /\n\s*\n/;

/** Параметр заклинания в строке карточки: подпись и значение. */
interface ReferenceStat {
  label: string;
  value: string;
}

/** Запись справочника: название, бейдж, параметры и описание. */
interface ReferenceEntry {
  title: string;

  /** Источник, круг и школа или группа предмета; пустая строка — бейджа нет. */
  badge: string;

  /** Параметры заклинания строкой ячеек; у умений и предметов пусто. */
  stats: ReferenceStat[];

  /** Описание, уже разобранное в блоки: HTML старой базы или разметка. */
  description: PdfTextBlock[];
}

/** Раздел справочника: заголовок и карточки. */
interface ReferenceSection {
  title: string;
  entries: ReferenceEntry[];
}

/** Разметка шапки карточки: строки названия и место бейджа. */
interface CardHeaderLayout {
  titleLines: string[];
  badge: string;

  /** Бейдж стоит справа от названия; false — отдельной строкой под ним. */
  isBadgeInline: boolean;

  height: number;
}

/** Разметка строки параметров: строки значения по ячейкам. */
interface CardStatsLayout {
  cells: Array<{ label: string; lines: string[] }>;
  height: number;
}

/** Карточка, размеченная до отрисовки: по высоте решается, где её начинать. */
interface CardLayout {
  entry: ReferenceEntry;
  header: CardHeaderLayout;
  stats: CardStatsLayout;
  blocks: PdfTextBlock[];

  /** Полная высота карточки вместе с отступами. */
  height: number;
}

/** Колонки справочника: страница, колонка и курсор. */
interface ReferenceColumns {
  readonly page: PDFPage;
  readonly top: number;

  /** Левая граница текущей колонки. */
  readonly left: number;

  /** Свободное место в текущей колонке до низа страницы. */
  readonly remaining: number;

  /** Высота свежей колонки — на неё равняется решение «резать или переносить». */
  readonly columnHeight: number;

  advance: (height: number) => void;

  /** Переход в следующую колонку, со второй колонки — на новую страницу. */
  nextColumn: () => void;
}

/** Ширина колонки справочника. */
const COLUMN_WIDTH = (PDF_CONTENT_WIDTH - PDF_REFERENCE_CARD.columnGap) / 2;

/** Ширина содержимого карточки. */
const CARD_INNER_WIDTH = COLUMN_WIDTH - PDF_REFERENCE_CARD.padding * 2;

/**
 * Свой текст листа в блоки: абзацы через пустую строку.
 *
 * @param text свой текст.
 * @returns блоки описания.
 */
function toPlainTextBlocks(text: string): PdfTextBlock[] {
  return toPdfTextBlocks(
    text
      .split(PARAGRAPH_SEPARATOR)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean),
  );
}

/**
 * Блоки «На более высоких уровнях»: подпись полужирным открывает первый абзац.
 *
 * @param detail карточка заклинания.
 * @returns блоки усиления; пусто — у заклинания его нет.
 */
function getUpcastBlocks(detail: SpellDetail): PdfTextBlock[] {
  const blocks = toPdfDescriptionBlocks(detail.upper);
  const [first, ...rest] = blocks;

  if (!first) {
    return [];
  }

  const label: PdfTextRun = { text: `${SPELL_TEXT.upper} `, style: 'bold' };

  return first.kind === 'paragraph'
    ? [{ ...first, runs: [label, ...first.runs] }, ...rest]
    : [{ kind: 'paragraph', runs: [label], rows: [], level: 1 }, ...blocks];
}

/**
 * Параметры заклинания: своё держит их прямо в листе, справочное — в
 * дозагруженной карточке.
 *
 * @param spell заклинание листа.
 * @param detail карточка справочника; не задана у своих заклинаний.
 * @returns непустые параметры в порядке строки листа.
 */
function getSpellStats(
  spell: SheetSpell,
  detail: SpellDetail | undefined,
): ReferenceStat[] {
  const values = detail
    ? {
        castingTime: detail.time ?? '',
        range: detail.range ?? '',
        components: getComponentsText(detail.components),
        duration: detail.duration ?? '',
      }
    : spell;

  return SPELL_STAT_KEYS.flatMap((key) =>
    values[key] ? [{ label: SPELL_STAT_LABELS[key], value: values[key] }] : [],
  );
}

/**
 * Запись справочника по заклинанию. Своё заклинание держит характеристики и
 * описание прямо в листе, справочное получает их дозагрузкой — дальше и то и
 * другое описывается одинаково.
 *
 * @param spell заклинание листа.
 * @param detail дозагруженная карточка; не задана у своих заклинаний.
 * @returns запись справочника или null, если описания нет.
 */
function getSpellEntry(
  spell: SheetSpell,
  detail: SpellDetail | undefined,
): ReferenceEntry | null {
  const description = detail
    ? [
        ...toPdfDescriptionBlocks(detail.description),
        ...getUpcastBlocks(detail),
      ]
    : toPlainTextBlocks(spell.description);

  if (!description.length) {
    return null;
  }

  return {
    title: spell.name,
    badge: [
      spell.level ? PDF_SPELL_LABELS.level(spell.level) : '',
      spell.school,
      spell.isConcentration ? PDF_SPELL_LABELS.concentration : '',
      spell.isRitual ? PDF_SPELL_LABELS.ritual : '',
    ]
      .filter(Boolean)
      .join(PDF_NOTE_SEPARATOR),
    stats: getSpellStats(spell, detail),
    description,
  };
}

/**
 * Запись справочника по предмету снаряжения. Предмет без описания карточки не
 * получает: название и вес уже есть в снаряжении листа.
 *
 * @param item предмет снаряжения.
 * @param groupTitle группа предмета на вкладке снаряжения.
 * @param catalogDescription дозагруженное описание; не задано у своих предметов.
 * @returns запись справочника или null, если описания нет.
 */
function getItemEntry(
  item: SheetItem,
  groupTitle: string,
  catalogDescription: PdfTextBlock[],
): ReferenceEntry | null {
  const description = item.description.trim()
    ? toPlainTextBlocks(item.description)
    : catalogDescription;

  if (!description.length) {
    return null;
  }

  return { title: item.name, badge: groupTitle, stats: [], description };
}

/**
 * Запись справочника по особенности: источник и выбор игрока — бейджем.
 *
 * @param feature особенность листа.
 * @returns запись справочника или null, если описания нет.
 */
function getFeatureEntry(feature: PdfFeatureRow): ReferenceEntry | null {
  const description = toPdfDescriptionBlocks(feature.description);

  if (!description.length) {
    return null;
  }

  return {
    title: feature.name,
    badge: [feature.source, feature.choice]
      .filter(Boolean)
      .join(PDF_NOTE_SEPARATOR),
    stats: [],
    description,
  };
}

/**
 * Отбрасывает записи без описания.
 *
 * @param entry запись справочника или null.
 * @returns true — запись есть.
 */
function isReferenceEntry(
  entry: ReferenceEntry | null,
): entry is ReferenceEntry {
  return entry !== null;
}

/**
 * Разделы справочника: особенности, заклинания и предметы с описаниями.
 * Порядок повторяет списки листа — заклинания по кругам, предметы по
 * группам, — чтобы запись искалась там же, где и на основных страницах.
 * Пустые разделы опущены.
 *
 * @param sheet лист.
 * @returns разделы в порядке вывода.
 */
function getReferenceSections(sheet: PdfSheet): ReferenceSection[] {
  const { catalog } = sheet;

  const features = getPdfFeatureRows(sheet)
    .map((feature) => getFeatureEntry(feature))
    .filter(isReferenceEntry);

  const spells = getPdfSpellGroups(sheet)
    .flatMap((group) => group.spells)
    .map(({ spell }) =>
      getSpellEntry(
        spell,
        spell.url ? catalog.spells.get(spell.url) : undefined,
      ),
    )
    .filter(isReferenceEntry);

  const items = getPdfInventoryGroups(sheet)
    .flatMap((group) =>
      group.items.map((item) =>
        getItemEntry(
          item,
          group.title,
          toPdfDescriptionBlocks(
            item.url ? catalog.items.get(item.url) : undefined,
          ),
        ),
      ),
    )
    .filter(isReferenceEntry);

  return [
    { title: PDF_REFERENCE_SECTIONS.features, entries: features },
    { title: PDF_REFERENCE_SECTIONS.spells, entries: spells },
    { title: PDF_REFERENCE_SECTIONS.items, entries: items },
  ].filter((section) => section.entries.length);
}

/**
 * Контур со срезанными углами в координатах SVG-пути (от левого верхнего угла,
 * ось Y вниз). Срез только сверху — для полосы шапки, которая лежит по верхнему
 * краю рамки.
 *
 * @param width ширина.
 * @param height высота.
 * @param topOnly срезать только верхние углы.
 * @returns строка SVG-пути.
 */
function getChamferPath(
  width: number,
  height: number,
  topOnly = false,
): string {
  const cut = Math.min(PDF_REFERENCE_CARD.chamfer, width / 2, height / 2);
  const bottomCut = topOnly ? 0 : cut;

  return [
    `M ${cut} 0`,
    `L ${width - cut} 0`,
    `L ${width} ${cut}`,
    `L ${width} ${height - bottomCut}`,
    `L ${width - bottomCut} ${height}`,
    `L ${bottomCut} ${height}`,
    `L 0 ${height - bottomCut}`,
    `L 0 ${cut}`,
    'Z',
  ].join(' ');
}

/**
 * Рамка части карточки. Рисуется после содержимого и без заливки — иначе
 * закрыла бы текст.
 *
 * @param page страница.
 * @param rect геометрия части карточки.
 */
function drawCardFrame(page: PDFPage, rect: PdfRect): void {
  page.drawSvgPath(getChamferPath(rect.width, rect.height), {
    x: rect.left,
    y: PDF_PAGE_HEIGHT - rect.top,
    borderColor: PDF_COLORS.panelLine,
    borderWidth: PDF_LINE_WIDTH,
  });
}

/**
 * Колонки справочника: первая страница начинается заголовком «Справочник»,
 * следующие — его продолжением.
 *
 * @param context документ в процессе сборки.
 * @returns колонки с курсором.
 */
function createReferenceColumns(context: PdfBuildContext): ReferenceColumns {
  /**
   * Новая страница справочника с заголовком во всю ширину.
   *
   * @param continued заголовок с пометкой о продолжении.
   * @returns страница и верх колонок под заголовком.
   */
  function startPage(continued: boolean): { page: PDFPage; top: number } {
    const flow = createPdfFlow(context, {
      left: PDF_PAGE_MARGIN,
      width: PDF_CONTENT_WIDTH,
      top: PDF_PAGE_MARGIN,
    });

    drawSectionHeader(context, flow, PDF_TITLES.reference, continued);

    return { page: flow.page, top: flow.top };
  }

  const first = startPage(false);

  const state = {
    page: first.page,
    column: 0,
    top: first.top,
    columnTop: first.top,
  };

  return {
    get page(): PDFPage {
      return state.page;
    },

    get top(): number {
      return state.top;
    },

    get left(): number {
      return (
        PDF_PAGE_MARGIN
        + (COLUMN_WIDTH + PDF_REFERENCE_CARD.columnGap) * state.column
      );
    },

    get remaining(): number {
      return PDF_CONTENT_BOTTOM - state.top;
    },

    get columnHeight(): number {
      return PDF_CONTENT_BOTTOM - state.columnTop;
    },

    advance(height: number): void {
      state.top += height;
    },

    nextColumn(): void {
      if (state.column === 0) {
        state.column = 1;
        state.top = state.columnTop;

        return;
      }

      const next = startPage(true);

      state.page = next.page;
      state.column = 0;
      state.top = next.top;
      state.columnTop = next.top;
    },
  };
}

/**
 * Высота описания в ширину карточки: те же переносы, что и при отрисовке, через
 * поток, который только меряет.
 *
 * @param context документ в процессе сборки.
 * @param page любая страница документа — поток на ней не рисует.
 * @param blocks блоки описания.
 * @returns высота описания.
 */
function measureBlocks(
  context: PdfBuildContext,
  page: PDFPage,
  blocks: PdfTextBlock[],
): number {
  let top = 0;

  const flow: PdfFlow = {
    page,
    left: 0,
    width: CARD_INNER_WIDTH,
    measuring: true,

    get top(): number {
      return top;
    },

    ensure: () => false,

    advance(height: number): void {
      top += height;
    },
  };

  drawTextBlocks(context, flow, blocks, PDF_REFERENCE_CARD.bodySize);

  return top;
}

/**
 * Разметка шапки: бейдж встаёт справа от названия, если влезает в отведённую
 * ему долю ширины, иначе — отдельной строкой под названием. Обрезать бейдж
 * нельзя: в нём источник и выбор игрока.
 *
 * @param context документ в процессе сборки.
 * @param entry запись справочника.
 * @returns строки названия, место бейджа и высота шапки.
 */
function getCardHeaderLayout(
  context: PdfBuildContext,
  entry: ReferenceEntry,
): CardHeaderLayout {
  const { titleSize, badgeSize, badgeMaxRatio } = PDF_REFERENCE_CARD;

  const badgeWidth = entry.badge
    ? getTextWidth(entry.badge, context.fonts.italic, badgeSize)
    : 0;

  const isBadgeInline = badgeWidth <= CARD_INNER_WIDTH * badgeMaxRatio;

  const titleWidth = isBadgeInline
    ? CARD_INNER_WIDTH - badgeWidth - (badgeWidth ? 6 : 0)
    : CARD_INNER_WIDTH;

  const titleLines = wrapPlainText(
    entry.title,
    context.fonts.bold,
    titleSize,
    titleWidth,
  );

  const badgeHeight = isBadgeInline
    ? 0
    : wrapPlainText(
        entry.badge,
        context.fonts.italic,
        badgeSize,
        CARD_INNER_WIDTH,
      ).length
      * badgeSize
      * PDF_LINE_HEIGHT_RATIO;

  return {
    titleLines,
    badge: entry.badge,
    isBadgeInline,
    height:
      titleLines.length * titleSize * PDF_LINE_HEIGHT_RATIO + badgeHeight + 3,
  };
}

/**
 * Разметка строки параметров заклинания: ячейки равной ширины, значения с
 * переносом в пределах ячейки.
 *
 * @param context документ в процессе сборки.
 * @param stats параметры заклинания.
 * @returns ячейки и высота строки; у записи без параметров высота нулевая.
 */
function getCardStatsLayout(
  context: PdfBuildContext,
  stats: ReferenceStat[],
): CardStatsLayout {
  if (!stats.length) {
    return { cells: [], height: 0 };
  }

  const { statLabelSize, statValueSize, statMaxLines } = PDF_REFERENCE_CARD;
  const cellWidth = CARD_INNER_WIDTH / stats.length;

  const cells = stats.map((stat) => {
    const wrapped = wrapPlainText(
      stat.value,
      context.fonts.regular,
      statValueSize,
      cellWidth - 4,
    );

    const lines = wrapped.slice(0, statMaxLines);

    // Обрезанное значение (длинный материальный компонент) кончается
    // многоточием: целиком оно есть в описании на сайте.
    if (wrapped.length > statMaxLines) {
      lines[statMaxLines - 1] = truncateText(
        `${lines[statMaxLines - 1] ?? ''}${PDF_ELLIPSIS}`,
        context.fonts.regular,
        statValueSize,
        cellWidth - 4,
      );
    }

    return { label: stat.label, lines };
  });

  const lineCount = Math.max(...cells.map((cell) => cell.lines.length));

  return {
    cells,
    height:
      4
      + statLabelSize
      + 2
      + lineCount * statValueSize * PDF_LINE_HEIGHT_RATIO
      + 3,
  };
}

/**
 * Шапка карточки: полоса с названием и бейджем по верхнему краю рамки.
 *
 * @param context документ в процессе сборки.
 * @param columns колонки справочника.
 * @param header разметка шапки.
 */
function drawCardHeader(
  context: PdfBuildContext,
  columns: ReferenceColumns,
  header: CardHeaderLayout,
): void {
  const { padding, titleSize, badgeSize } = PDF_REFERENCE_CARD;
  const bandHeight = padding + header.height;

  columns.page.drawSvgPath(getChamferPath(COLUMN_WIDTH, bandHeight, true), {
    x: columns.left,
    y: PDF_PAGE_HEIGHT - columns.top,
    color: PDF_COLORS.titleFill,
  });

  const left = columns.left + padding;
  const titleLineHeight = titleSize * PDF_LINE_HEIGHT_RATIO;

  let top = columns.top + padding - 1;

  for (const line of header.titleLines) {
    drawTextLine(columns.page, {
      text: line,
      left,
      top,
      font: context.fonts.bold,
      size: titleSize,
      maxWidth: CARD_INNER_WIDTH,
    });

    top += titleLineHeight;
  }

  if (header.badge && header.isBadgeInline) {
    drawTextLine(columns.page, {
      text: header.badge,
      left,
      top: columns.top + padding - 1 + (titleSize - badgeSize) / 2 + 0.5,
      font: context.fonts.italic,
      size: badgeSize,
      color: PDF_COLORS.muted,
      maxWidth: CARD_INNER_WIDTH,
      align: 'right',
    });
  }

  if (header.badge && !header.isBadgeInline) {
    for (const line of wrapPlainText(
      header.badge,
      context.fonts.italic,
      badgeSize,
      CARD_INNER_WIDTH,
    )) {
      drawTextLine(columns.page, {
        text: line,
        left,
        top,
        font: context.fonts.italic,
        size: badgeSize,
        color: PDF_COLORS.muted,
        maxWidth: CARD_INNER_WIDTH,
      });

      top += badgeSize * PDF_LINE_HEIGHT_RATIO;
    }
  }

  columns.advance(bandHeight);
}

/**
 * Строка параметров заклинания: подпись мелко прописными, значение под ней;
 * снизу — черта, отделяющая параметры от описания.
 *
 * @param context документ в процессе сборки.
 * @param columns колонки справочника.
 * @param stats разметка строки параметров.
 */
function drawCardStats(
  context: PdfBuildContext,
  columns: ReferenceColumns,
  stats: CardStatsLayout,
): void {
  if (!stats.cells.length) {
    return;
  }

  const { padding, statLabelSize, statValueSize } = PDF_REFERENCE_CARD;
  const left = columns.left + padding;
  const cellWidth = CARD_INNER_WIDTH / stats.cells.length;
  const labelTop = columns.top + 4;
  const valueTop = labelTop + statLabelSize + 2;

  for (const [index, cell] of stats.cells.entries()) {
    const cellLeft = left + cellWidth * index;

    drawTextLine(columns.page, {
      text: cell.label.toUpperCase(),
      left: cellLeft,
      top: labelTop,
      font: context.fonts.bold,
      size: statLabelSize,
      color: PDF_COLORS.muted,
      maxWidth: cellWidth - 4,
    });

    for (const [lineIndex, line] of cell.lines.entries()) {
      drawTextLine(columns.page, {
        text: line,
        left: cellLeft,
        top: valueTop + lineIndex * statValueSize * PDF_LINE_HEIGHT_RATIO,
        font: context.fonts.regular,
        size: statValueSize,
        maxWidth: cellWidth - 4,
      });
    }
  }

  drawRule(columns.page, {
    left,
    top: columns.top + stats.height - 1,
    width: CARD_INNER_WIDTH,
  });

  columns.advance(stats.height + 2);
}

/**
 * Разметка карточки целиком и её полная высота — до отрисовки.
 *
 * @param context документ в процессе сборки.
 * @param page любая страница документа для замера описания.
 * @param entry запись справочника.
 * @returns разметка карточки.
 */
function getCardLayout(
  context: PdfBuildContext,
  page: PDFPage,
  entry: ReferenceEntry,
): CardLayout {
  const { padding } = PDF_REFERENCE_CARD;
  const header = getCardHeaderLayout(context, entry);
  const stats = getCardStatsLayout(context, entry.stats);
  const blocks = entry.description;
  const bodyHeight = measureBlocks(context, page, blocks);

  return {
    entry,
    header,
    stats,
    blocks,
    height: padding + header.height + stats.height + 2 + bodyHeight + padding,
  };
}

/**
 * Карточка уходит в следующую колонку целиком, если не влезает в остаток и
 * при этом короткая — резать её незачем, пустоты останется немного, — либо
 * остаток слишком мал, чтобы начинать в нём разрезанную карточку. Длинная
 * карточка начинается в остатке и продолжается в следующей колонке: целиком
 * она оставила бы за собой полколонки пустоты.
 *
 * @param columns колонки справочника.
 * @param height полная высота карточки.
 * @param reserved место над карточкой, которое ещё займёт заголовок раздела.
 * @returns true — карточку надо начинать в следующей колонке.
 */
function shouldMoveCard(
  columns: ReferenceColumns,
  height: number,
  reserved = 0,
): boolean {
  const { minSplitHeight, keepWholeRatio } = PDF_REFERENCE_CARD;
  const remaining = columns.remaining - reserved;

  return (
    height > remaining
    && (height <= columns.columnHeight * keepWholeRatio
      || remaining < minSplitHeight)
  );
}

/**
 * Карточка записи. Высота меряется заранее: карточка, которая не влезает в
 * остаток колонки, но помещается в свежую, целиком уходит в следующую колонку.
 * Режется только карточка выше колонки — продолжение начинается с названия и
 * пометки «продолжение», у каждой части своя рамка.
 *
 * @param context документ в процессе сборки.
 * @param columns колонки справочника.
 * @param card разметка карточки.
 */
function drawReferenceCard(
  context: PdfBuildContext,
  columns: ReferenceColumns,
  card: CardLayout,
): void {
  const { padding, gap, bodySize, badgeSize } = PDF_REFERENCE_CARD;
  const { entry, header, stats, blocks } = card;

  if (shouldMoveCard(columns, card.height)) {
    columns.nextColumn();
  }

  let segment = { page: columns.page, left: columns.left, top: columns.top };

  /**
   * Обводит набранную часть карточки рамкой по текущий курсор.
   *
   * @param bottom нижняя граница части.
   */
  const closeSegment = (bottom: number): void => {
    drawCardFrame(segment.page, {
      left: segment.left,
      top: segment.top,
      width: COLUMN_WIDTH,
      height: bottom - segment.top,
    });
  };

  drawCardHeader(context, columns, header);
  drawCardStats(context, columns, stats);
  columns.advance(2);

  const flow: PdfFlow = {
    width: CARD_INNER_WIDTH,

    get page(): PDFPage {
      return columns.page;
    },

    get left(): number {
      return columns.left + padding;
    },

    get top(): number {
      return columns.top;
    },

    ensure(height: number): boolean {
      if (height <= columns.remaining - padding) {
        return false;
      }

      closeSegment(columns.top + padding);
      columns.nextColumn();
      segment = { page: columns.page, left: columns.left, top: columns.top };

      // Продолжение начинается с названия: иначе обрывок описания в соседней
      // колонке не с чем связать.
      drawTextLine(columns.page, {
        text: `${entry.title}${PDF_CONTINUED_SUFFIX}`,
        left: columns.left + padding,
        top: columns.top + padding - 1,
        font: context.fonts.italic,
        size: badgeSize + 0.5,
        color: PDF_COLORS.muted,
        maxWidth: CARD_INNER_WIDTH,
      });

      columns.advance(padding + (badgeSize + 0.5) * PDF_LINE_HEIGHT_RATIO + 2);

      return true;
    },

    advance(height: number): void {
      columns.advance(height);
    },
  };

  drawTextBlocks(context, flow, blocks, bodySize);

  // Последний блок описания уже оставил под собой ползазора абзаца.
  columns.advance(padding / 2);
  closeSegment(columns.top);
  columns.advance(gap);
}

/**
 * Заголовок раздела в колонке: прописные с разрядкой и черта во всю колонку.
 * Одинокий заголовок внизу колонки не ставится — он уходит вместе с первой
 * карточкой раздела.
 *
 * @param context документ в процессе сборки.
 * @param columns колонки справочника.
 * @param title заголовок раздела.
 * @param firstCardHeight высота первой карточки раздела.
 */
function drawSectionTitle(
  context: PdfBuildContext,
  columns: ReferenceColumns,
  title: string,
  firstCardHeight: number,
): void {
  const { sectionSize } = PDF_REFERENCE_CARD;
  const height = sectionSize + 8;

  if (shouldMoveCard(columns, firstCardHeight, height)) {
    columns.nextColumn();
  }

  drawTextLine(columns.page, {
    text: title.toUpperCase(),
    left: columns.left,
    top: columns.top,
    font: context.fonts.display,
    size: sectionSize,
    letterSpacing: sectionSize * PDF_TITLE_LETTER_SPACING_RATIO,
    maxWidth: COLUMN_WIDTH,
  });

  drawRule(columns.page, {
    left: columns.left,
    top: columns.top + sectionSize + 3,
    width: COLUMN_WIDTH,
    color: PDF_COLORS.panelLine,
    thickness: PDF_LINE_WIDTH,
  });

  columns.advance(height);
}

/**
 * Справочник: полные описания особенностей, заклинаний и предметов
 * компактными карточками в две колонки, по разделам. Страница не создаётся,
 * если описаний нет.
 *
 * @param context документ в процессе сборки.
 * @param sheet лист.
 */
export function drawReferencePage(
  context: PdfBuildContext,
  sheet: PdfSheet,
): void {
  const sections = getReferenceSections(sheet);

  if (!sections.length) {
    return;
  }

  const columns = createReferenceColumns(context);

  for (const section of sections) {
    const cards = section.entries.map((entry) =>
      getCardLayout(context, columns.page, entry),
    );

    drawSectionTitle(context, columns, section.title, cards[0]?.height ?? 0);

    for (const card of cards) {
      drawReferenceCard(context, columns, card);
    }
  }
}
