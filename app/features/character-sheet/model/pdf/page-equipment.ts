import type { SheetItem } from '../schema';
import type { PdfBuildContext, PdfSheet, PdfTableColumn } from './types';

import { CARRYING_TEXT, CURRENCY_KEYS, CURRENCY_LABELS } from '../constants';
import {
  PDF_ATTUNEMENT_MARKS,
  PDF_COIN_BOX_HEIGHT,
  PDF_CONTENT_WIDTH,
  PDF_EQUIPMENT_COLUMN_RATIOS,
  PDF_EQUIPMENT_COLUMNS,
  PDF_EQUIPMENT_MIN_ROWS,
  PDF_EQUIPPED_MARK,
  PDF_FONT_SIZES,
  PDF_GAP,
  PDF_LABELS,
  PDF_PAGE_MARGIN,
  PDF_ROW_HEIGHT,
  PDF_TITLES,
} from './constants';
import { getPdfInventoryGroups } from './data';
import {
  createPdfFlow,
  drawSectionHeader,
  drawTableHead,
  drawTableRow,
  drawTextBlocks,
  drawValueBox,
} from './layout';
import { toPdfHeadingBlock, toPdfTextBlocks } from './markup-text';

/** Вес в фунтах по-русски: «2,5». */
const weightFormat = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 2,
});

/**
 * Вес с единицами листа: «2,5 фнт».
 *
 * @param pounds вес в фунтах.
 * @returns подпись веса.
 */
function formatWeight(pounds: number): string {
  return `${weightFormat.format(pounds)} ${CARRYING_TEXT.unit}`;
}

/**
 * Название предмета для таблицы: предмету с настройкой она приписывается прямо
 * к названию — на бумаге сверяться с меню листа не с чем.
 *
 * @param item предмет снаряжения.
 * @returns название предмета для строки таблицы.
 */
function getEquipmentItemName(item: SheetItem): string {
  if (!item.requiresAttunement) {
    return item.name;
  }

  const mark = item.isAttuned
    ? PDF_ATTUNEMENT_MARKS.attuned
    : PDF_ATTUNEMENT_MARKS.required;

  return `${item.name} (${mark})`;
}

/**
 * Столбцы таблицы снаряжения.
 *
 * @returns столбцы с шириной по доле содержимого страницы.
 */
function getEquipmentColumns(): PdfTableColumn[] {
  return [
    {
      title: PDF_EQUIPMENT_COLUMNS.name,
      width: PDF_CONTENT_WIDTH * PDF_EQUIPMENT_COLUMN_RATIOS.name,
      align: 'left',
    },
    {
      title: PDF_EQUIPMENT_COLUMNS.quantity,
      width: PDF_CONTENT_WIDTH * PDF_EQUIPMENT_COLUMN_RATIOS.quantity,
      align: 'center',
    },
    {
      title: PDF_EQUIPMENT_COLUMNS.weight,
      width: PDF_CONTENT_WIDTH * PDF_EQUIPMENT_COLUMN_RATIOS.weight,
      align: 'right',
    },
    {
      title: PDF_EQUIPMENT_COLUMNS.cost,
      width: PDF_CONTENT_WIDTH * PDF_EQUIPMENT_COLUMN_RATIOS.cost,
      align: 'right',
    },
    {
      title: PDF_EQUIPMENT_COLUMNS.equipped,
      width: PDF_CONTENT_WIDTH * PDF_EQUIPMENT_COLUMN_RATIOS.equipped,
      align: 'center',
    },
  ];
}

/**
 * Страница снаряжения: монеты, вес, таблица предметов по группам и заметки
 * игрока. Длинные списки продолжаются на следующих страницах.
 *
 * @param context документ в процессе сборки.
 * @param sheet лист.
 */
export function drawEquipmentPage(
  context: PdfBuildContext,
  sheet: PdfSheet,
): void {
  const { document, stats } = sheet;

  const flow = createPdfFlow(context, {
    left: PDF_PAGE_MARGIN,
    width: PDF_CONTENT_WIDTH,
    top: PDF_PAGE_MARGIN,
  });

  drawSectionHeader(context, flow, PDF_TITLES.coins);

  const coins = [
    ...CURRENCY_KEYS.map((key) => ({
      label: CURRENCY_LABELS[key],
      value: String(document.currency[key]),
    })),
    ...document.customCurrencies.map((currency) => ({
      label: currency.short || currency.name,
      value: String(currency.amount),
    })),
  ];

  const coinWidth =
    (flow.width - PDF_GAP * (coins.length - 1)) / Math.max(coins.length, 1);

  for (const [index, coin] of coins.entries()) {
    drawValueBox(context, flow.page, {
      left: flow.left + (coinWidth + PDF_GAP) * index,
      top: flow.top,
      width: coinWidth,
      height: PDF_COIN_BOX_HEIGHT,
      label: coin.label,
      value: coin.value,
      valueSize: PDF_FONT_SIZES.mediumValue + 2,
    });
  }

  flow.advance(PDF_COIN_BOX_HEIGHT + PDF_GAP * 1.5);

  drawSectionHeader(context, flow, PDF_TITLES.equipment);

  const columns = getEquipmentColumns();

  drawTableRow(
    context,
    flow,
    columns,
    [
      `${PDF_LABELS.carried}: ${formatWeight(stats.carriedWeight)}`,
      '',
      '',
      `${PDF_LABELS.capacity}: ${formatWeight(stats.carrying.value)}`,
      '',
    ],
    { bold: true, divider: false },
  );

  drawTableHead(context, flow, columns);

  let rowCount = 0;

  for (const group of getPdfInventoryGroups(sheet)) {
    if (flow.ensure(PDF_ROW_HEIGHT * 2)) {
      drawSectionHeader(context, flow, PDF_TITLES.equipment, true);
      drawTableHead(context, flow, columns);
    }

    drawTableRow(context, flow, columns, [group.title, '', '', '', ''], {
      bold: true,
    });

    rowCount += 1;

    for (const item of group.items) {
      if (flow.ensure(PDF_ROW_HEIGHT)) {
        drawSectionHeader(context, flow, PDF_TITLES.equipment, true);
        drawTableHead(context, flow, columns);
      }

      drawTableRow(context, flow, columns, [
        getEquipmentItemName(item),
        String(item.quantity),
        item.weight ? formatWeight(item.weight) : '',
        item.cost,
        item.isEquipped ? PDF_EQUIPPED_MARK : '',
      ]);

      rowCount += 1;
    }
  }

  // Пустые строки под запись от руки: в бумажном листе снаряжение дописывают
  // ручкой, поэтому короткий инвентарь не должен обрываться сразу под шапкой.
  for (let index = rowCount; index < PDF_EQUIPMENT_MIN_ROWS; index += 1) {
    drawTableRow(context, flow, columns, []);
  }

  // Заметки идут записями: название каждой рисуется заголовком над её текстом.
  const noteBlocks = document.notes.flatMap((note) => [
    ...(note.title ? [toPdfHeadingBlock(note.title)] : []),
    ...toPdfTextBlocks(note.text),
  ]);

  if (!noteBlocks.length) {
    return;
  }

  flow.advance(PDF_GAP * 1.5);
  drawSectionHeader(context, flow, PDF_TITLES.notes);
  drawTextBlocks(context, flow, noteBlocks);
}
