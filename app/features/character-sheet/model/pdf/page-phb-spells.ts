import type { PDFPage } from 'pdf-lib';

import type { PdfSpellGroup } from './data';
import type { PdfBuildContext, PdfRect, PdfSheet } from './types';

import { degrees } from 'pdf-lib';

import { ABILITY_LABELS } from '../constants';
import { formatModifier } from '../utils';
import {
  PDF_CONTENT_WIDTH,
  PDF_MARK_RADIUS,
  PDF_PAGE_HEIGHT,
  PDF_PAGE_MARGIN,
} from './constants';
import {
  getPdfSpellcasting,
  getPdfSpellGroups,
  getPdfSpellSlotRows,
} from './data';
import { createPdfPage, drawMark, drawRule, drawTextLine } from './layout';
import {
  PHB_BODY_TOP,
  PHB_COLORS,
  PHB_COLUMN_GAP,
  PHB_FONT_SIZES,
  PHB_LABELS,
  PHB_LINE_WIDTHS,
  PHB_PADDING,
  PHB_SPELLS,
} from './phb-constants';
import {
  drawPhbBanner,
  drawPhbBox,
  drawPhbCaption,
  drawPhbCenteredValue,
  drawPhbGroup,
  drawPhbHexagon,
  getPhbHeaderBoxRect,
} from './phb-layout';

/** Ячейки круга: сколько всего и сколько потрачено. */
interface SlotTotals {
  total: number;
  used: number;
}

/** Ширина колонки блоков кругов. */
const COLUMN_WIDTH = (PDF_CONTENT_WIDTH - PHB_COLUMN_GAP * 2) / 3;

/**
 * Ячейки по кругам: обычные и ячейки договора складываются в свой круг.
 *
 * @param sheet лист.
 * @returns ячейки по номеру круга.
 */
function getSlotTotals(sheet: PdfSheet): Map<number, SlotTotals> {
  const totals = new Map<number, SlotTotals>();

  for (const row of getPdfSpellSlotRows(sheet)) {
    const current = totals.get(row.level) ?? { total: 0, used: 0 };

    totals.set(row.level, {
      total: current.total + row.max,
      used: current.used + row.used,
    });
  }

  return totals;
}

/**
 * Шапка страницы заклинаний: лента с классом заклинателя и три поля в
 * шестиугольниках.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param sheet лист.
 */
function drawSpellsHeader(
  context: PdfBuildContext,
  page: PDFPage,
  sheet: PdfSheet,
): void {
  const spellcasting = getPdfSpellcasting(sheet);

  drawPhbBanner(context, page, {
    label: PHB_LABELS.spellcastingClass,
    value: spellcasting?.classNames.join(' / ') ?? '',
  });

  const rect = getPhbHeaderBoxRect();

  drawPhbBox(page, rect);

  const fields = [
    {
      label: PHB_LABELS.spellAbility,
      value: spellcasting ? ABILITY_LABELS[spellcasting.ability].name : '',
    },
    {
      label: PHB_LABELS.spellSaveDc,
      value: spellcasting ? String(spellcasting.saveDc) : '',
    },
    {
      label: PHB_LABELS.spellAttack,
      value: spellcasting ? formatModifier(spellcasting.attack) : '',
    },
  ];

  const slotWidth = (rect.width - PHB_PADDING * 2) / fields.length;
  const hexHeight = 24;

  for (const [index, field] of fields.entries()) {
    const slotLeft = rect.left + PHB_PADDING + slotWidth * index;
    const hexLeft = slotLeft + (slotWidth - PHB_SPELLS.hexWidth) / 2;
    const hexTop = rect.top + PHB_PADDING + 2;

    drawPhbHexagon(page, {
      left: hexLeft,
      top: hexTop,
      width: PHB_SPELLS.hexWidth,
      height: hexHeight,
    });

    drawPhbCenteredValue(context, page, {
      text: field.value,
      left: hexLeft + 8,
      width: PHB_SPELLS.hexWidth - 16,
      size: PHB_FONT_SIZES.medium,
      centerTop: hexTop + hexHeight / 2,
    });

    drawPhbCaption(context, page, {
      text: field.label,
      left: slotLeft + 2,
      top: hexTop + hexHeight + 4,
      width: slotWidth - 4,
      size: PHB_FONT_SIZES.label,
    });
  }
}

/**
 * Шапка блока круга: номер в шестиугольнике, у заговоров — подпись, у
 * кругов 1–9 — поля «Итого ячеек» и «Ячеек израсходовано».
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param options геометрия, круг и ячейки.
 * @param options.level круг.
 * @param options.slots ячейки круга.
 */
function drawBlockHeader(
  context: PdfBuildContext,
  page: PDFPage,
  options: PdfRect & { level: number; slots: SlotTotals | undefined },
): void {
  const { levelWidth, totalWidth } = PHB_SPELLS;
  const stripLeft = options.left + levelWidth / 2;

  drawPhbGroup(page, {
    left: stripLeft,
    top: options.top + 2,
    width: options.width - levelWidth / 2,
    height: options.height - 4,
  });

  drawPhbHexagon(page, {
    left: options.left,
    top: options.top,
    width: levelWidth,
    height: options.height,
  });

  drawPhbCenteredValue(context, page, {
    text: String(options.level),
    left: options.left,
    width: levelWidth,
    size: PHB_FONT_SIZES.medium + 1,
    centerTop: options.top + options.height / 2,
  });

  const contentLeft = options.left + levelWidth + 3;

  if (!options.level) {
    drawPhbCaption(context, page, {
      text: PHB_LABELS.cantrips,
      left: contentLeft,
      top: options.top + options.height / 2 - PHB_FONT_SIZES.title / 2 - 1,
      width: options.left + options.width - contentLeft - PHB_PADDING,
    });

    return;
  }

  const fieldTop = options.top + 4;
  const fieldHeight = options.height - 15;
  const usedLeft = contentLeft + totalWidth + 4;
  const usedWidth = options.left + options.width - PHB_PADDING - usedLeft;

  const fields = [
    {
      left: contentLeft,
      width: totalWidth,
      label: PHB_LABELS.slotsTotal,
      value: options.slots?.total ? String(options.slots.total) : '',
    },
    {
      left: usedLeft,
      width: usedWidth,
      label: PHB_LABELS.slotsUsed,
      value: options.slots?.used ? String(options.slots.used) : '',
    },
  ];

  for (const field of fields) {
    drawPhbBox(page, {
      left: field.left,
      top: fieldTop,
      width: field.width,
      height: fieldHeight,
      radius: 2,
      borderWidth: PHB_LINE_WIDTHS.thin,
    });

    drawPhbCenteredValue(context, page, {
      text: field.value,
      left: field.left,
      width: field.width,
      size: PHB_FONT_SIZES.rowValue,
      centerTop: fieldTop + fieldHeight / 2,
    });

    drawPhbCaption(context, page, {
      text: field.label,
      left: field.left,
      top: fieldTop + fieldHeight + 1.5,
      width: field.width,
      size: PHB_FONT_SIZES.label - 0.6,
    });
  }
}

/**
 * Блок круга: шапка и строки заклинаний с кружком подготовки. Не влезшие
 * заклинания сворачиваются в последнюю строку — полностью они есть в
 * справочнике.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param options геометрия, круг, заклинания и ячейки.
 * @param options.left левая граница блока.
 * @param options.top верх блока.
 * @param options.level круг.
 * @param options.group заклинания круга.
 * @param options.slots ячейки круга.
 * @returns высота блока.
 */
function drawSpellBlock(
  context: PdfBuildContext,
  page: PDFPage,
  options: {
    left: number;
    top: number;
    level: number;
    group: PdfSpellGroup | undefined;
    slots: SlotTotals | undefined;
  },
): number {
  const { headerHeight, rowHeight, captionHeight } = PHB_SPELLS;
  const rowCount = PHB_SPELLS.rows[options.level] ?? 0;
  const spells = options.group?.spells ?? [];
  const hasMarks = options.level > 0;

  drawBlockHeader(context, page, {
    left: options.left,
    top: options.top,
    width: COLUMN_WIDTH,
    height: headerHeight,
    level: options.level,
    slots: options.slots,
  });

  let cursor = options.top + headerHeight + 2;

  // Подписи столбцов — у первых двух блоков, как на печатном листе.
  if (options.level <= 1) {
    drawPhbCaption(context, page, {
      text: options.level ? PHB_LABELS.prepared : PHB_LABELS.spellLevel,
      left: options.left,
      top: cursor,
      width: COLUMN_WIDTH / 2,
      size: PHB_FONT_SIZES.label - 0.6,
      align: 'left',
    });

    drawPhbCaption(context, page, {
      text: PHB_LABELS.spellName,
      left: options.left + COLUMN_WIDTH / 2,
      top: cursor,
      width: COLUMN_WIDTH / 2,
      size: PHB_FONT_SIZES.label - 0.6,
      align: 'right',
    });

    cursor += captionHeight;
  }

  const isOverflow = spells.length > rowCount;
  const visible = isOverflow ? spells.slice(0, rowCount - 1) : spells;
  const nameLeft = options.left + (hasMarks ? PDF_MARK_RADIUS * 2 + 5 : 2);
  const nameWidth = options.left + COLUMN_WIDTH - nameLeft;

  for (let index = 0; index < rowCount; index += 1) {
    const lineTop = cursor + rowHeight * (index + 1);
    const entry = visible[index];

    drawRule(page, {
      left: nameLeft,
      top: lineTop,
      width: nameWidth,
      color: PHB_COLORS.line,
      thickness: PHB_LINE_WIDTHS.ruling,
    });

    if (hasMarks) {
      drawMark(page, {
        centerLeft: options.left + PDF_MARK_RADIUS + 1,
        centerTop: lineTop - PHB_FONT_SIZES.line / 2 - 1,
        fill: entry?.isPrepared ? 'full' : 'none',
      });
    }

    const isTail = isOverflow && index === rowCount - 1;

    if (!entry && !isTail) {
      continue;
    }

    drawTextLine(page, {
      text: entry
        ? entry.spell.name
        : PHB_LABELS.more(spells.length - visible.length),
      left: nameLeft + 1,
      top: lineTop - PHB_FONT_SIZES.line - 1.5,
      font: entry ? context.fonts.regular : context.fonts.italic,
      size: PHB_FONT_SIZES.line,
      color: entry ? PHB_COLORS.ink : PHB_COLORS.label,
      maxWidth: nameWidth - 2,
    });
  }

  return cursor + rowHeight * rowCount - options.top;
}

/**
 * Страница заклинаний листа «как в Книге игрока»: шапка заклинателя и блоки
 * кругов 0–9 в три колонки. Страница не создаётся, если персонаж не
 * заклинатель и заклинаний у него нет.
 *
 * @param context документ в процессе сборки.
 * @param sheet лист.
 */
export function drawPhbSpellsPage(
  context: PdfBuildContext,
  sheet: PdfSheet,
): void {
  const groups = getPdfSpellGroups(sheet);
  const slots = getSlotTotals(sheet);

  if (!getPdfSpellcasting(sheet) && !groups.length && !slots.size) {
    return;
  }

  const page = createPdfPage(context);

  drawSpellsHeader(context, page, sheet);

  // «Известные заклинания» — вертикально по левому полю, как на печатном листе.
  page.drawText(PHB_LABELS.knownSpells.toUpperCase(), {
    x: PDF_PAGE_MARGIN - 4,
    y: PDF_PAGE_HEIGHT - PHB_BODY_TOP - 160,
    size: PHB_FONT_SIZES.label,
    font: context.fonts.bold,
    color: PHB_COLORS.label,
    rotate: degrees(90),
  });

  for (const [columnIndex, levels] of PHB_SPELLS.columns.entries()) {
    const left =
      PDF_PAGE_MARGIN + (COLUMN_WIDTH + PHB_COLUMN_GAP) * columnIndex;

    let cursor = PHB_BODY_TOP;

    for (const level of levels) {
      cursor +=
        drawSpellBlock(context, page, {
          left,
          top: cursor,
          level,
          group: groups.find((group) => group.level === level),
          slots: slots.get(level),
        }) + PHB_SPELLS.blockGap;
    }
  }
}
