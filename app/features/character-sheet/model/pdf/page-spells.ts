import type { SheetSpell } from '../schema';
import type { PdfSpellSlotRow } from './data';
import type {
  PdfBuildContext,
  PdfFlow,
  PdfSheet,
  PdfTableColumn,
} from './types';

import { range } from 'es-toolkit';

import {
  PDF_COLORS,
  PDF_CONTENT_WIDTH,
  PDF_FONT_SIZES,
  PDF_GAP,
  PDF_MARK_RADIUS,
  PDF_PAGE_MARGIN,
  PDF_ROW_HEIGHT,
  PDF_SPELL_COLUMN_RATIOS,
  PDF_SPELL_COLUMNS,
  PDF_SPELL_LABELS,
  PDF_SPELL_MARK_COLUMN_WIDTH,
  PDF_SPELL_SLOT_LEVEL_WIDTH,
  PDF_SPELL_SLOT_MARKS_LEFT,
  PDF_TITLES,
} from './constants';
import { getPdfSpellGroups, getPdfSpellSlotRows } from './data';
import {
  createPdfFlow,
  drawMark,
  drawSectionHeader,
  drawTableHead,
  drawTableRow,
  drawTextLine,
} from './layout';

/**
 * Столбцы таблицы заклинаний: первый столбец — кружок подготовки.
 *
 * @returns столбцы таблицы.
 */
function getSpellColumns(): PdfTableColumn[] {
  const nameWidth = PDF_CONTENT_WIDTH * PDF_SPELL_COLUMN_RATIOS.name;
  const schoolWidth = PDF_CONTENT_WIDTH * PDF_SPELL_COLUMN_RATIOS.school;

  return [
    { title: '', width: PDF_SPELL_MARK_COLUMN_WIDTH, align: 'center' },
    { title: PDF_SPELL_COLUMNS.name, width: nameWidth, align: 'left' },
    { title: PDF_SPELL_COLUMNS.school, width: schoolWidth, align: 'left' },
    {
      title: PDF_SPELL_COLUMNS.notes,
      width:
        PDF_CONTENT_WIDTH
        - PDF_SPELL_MARK_COLUMN_WIDTH
        - nameWidth
        - schoolWidth,
      align: 'left',
    },
  ];
}

/**
 * Свойства заклинания строкой: концентрация и ритуал.
 *
 * @param spell заклинание листа.
 * @returns подписи свойств через запятую.
 */
function getSpellNotes(spell: SheetSpell): string {
  const notes: string[] = [];

  if (spell.isConcentration) {
    notes.push(PDF_SPELL_LABELS.concentration);
  }

  if (spell.isRitual) {
    notes.push(PDF_SPELL_LABELS.ritual);
  }

  return notes.join(', ');
}

/**
 * Ряды ячеек заклинаний: круг, кружки по числу ячеек (закрашенные —
 * потрачены) и отдых, который их возвращает.
 *
 * @param context документ в процессе сборки.
 * @param rows ряды ячеек.
 * @param flow поток содержимого.
 */
function drawSpellSlots(
  context: PdfBuildContext,
  rows: PdfSpellSlotRow[],
  flow: PdfFlow,
): void {
  if (!rows.length) {
    return;
  }

  drawSectionHeader(context, flow, PDF_TITLES.spellSlots);

  for (const row of rows) {
    flow.ensure(PDF_ROW_HEIGHT);

    drawTextLine(flow.page, {
      text: row.label,
      left: flow.left,
      top: flow.top + 1,
      font: context.fonts.bold,
      size: PDF_FONT_SIZES.value,
      maxWidth: PDF_SPELL_SLOT_LEVEL_WIDTH,
    });

    for (const index of range(row.max)) {
      drawMark(flow.page, {
        centerLeft:
          flow.left
          + PDF_SPELL_SLOT_MARKS_LEFT
          + index * (PDF_MARK_RADIUS * 2 + 4),
        centerTop: flow.top + PDF_ROW_HEIGHT / 2,
        fill: index < row.used ? 'full' : 'none',
      });
    }

    drawTextLine(flow.page, {
      text: row.reset,
      left: flow.left + flow.width - 120,
      top: flow.top + 1,
      font: context.fonts.regular,
      size: PDF_FONT_SIZES.value,
      color: PDF_COLORS.muted,
      maxWidth: 120,
      align: 'right',
    });

    flow.advance(PDF_ROW_HEIGHT);
  }

  flow.advance(PDF_GAP);
}

/**
 * Страница заклинаний: ячейки по кругам и заклинания листа по кругам с
 * кружком подготовки. Страница не создаётся, если у персонажа нет ни ячеек,
 * ни заклинаний.
 *
 * @param context документ в процессе сборки.
 * @param sheet лист.
 */
export function drawSpellsPage(
  context: PdfBuildContext,
  sheet: PdfSheet,
): void {
  const slotRows = getPdfSpellSlotRows(sheet);
  const groups = getPdfSpellGroups(sheet);

  if (!groups.length && !slotRows.length) {
    return;
  }

  const flow = createPdfFlow(context, {
    left: PDF_PAGE_MARGIN,
    width: PDF_CONTENT_WIDTH,
    top: PDF_PAGE_MARGIN,
  });

  drawSpellSlots(context, slotRows, flow);

  if (!groups.length) {
    return;
  }

  drawSectionHeader(context, flow, PDF_TITLES.spells);

  const columns = getSpellColumns();

  drawTableHead(context, flow, columns);

  for (const group of groups) {
    if (flow.ensure(PDF_ROW_HEIGHT * 2)) {
      drawSectionHeader(context, flow, PDF_TITLES.spells, true);
      drawTableHead(context, flow, columns);
    }

    drawTableRow(context, flow, columns, ['', group.label], { bold: true });

    for (const { spell, isPrepared } of group.spells) {
      if (flow.ensure(PDF_ROW_HEIGHT)) {
        drawSectionHeader(context, flow, PDF_TITLES.spells, true);
        drawTableHead(context, flow, columns);
      }

      // Кружок подготовки рисуется до строки, но после проверки места: иначе
      // перенос страницы внутри строки оставил бы кружок на прошлой странице.
      drawMark(flow.page, {
        centerLeft: flow.left + PDF_SPELL_MARK_COLUMN_WIDTH / 2,
        centerTop: flow.top + PDF_ROW_HEIGHT / 2,
        fill: isPrepared ? 'full' : 'none',
      });

      drawTableRow(context, flow, columns, [
        '',
        spell.name,
        spell.school,
        getSpellNotes(spell),
      ]);
    }
  }
}
