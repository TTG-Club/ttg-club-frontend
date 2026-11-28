import type { PdfBuildContext, PdfSheet, PdfTextBlock } from './types';

import {
  PERSONALITY_TEXT_FIELDS,
  PERSONALITY_TRAIT_FIELDS,
  SHEET_LABELS,
} from '../constants';
import {
  PDF_CONTENT_WIDTH,
  PDF_FONT_SIZES,
  PDF_GAP,
  PDF_PAGE_MARGIN,
  PDF_PERSONALITY_BOX_HEIGHT,
  PDF_PERSONALITY_COLUMNS,
  PDF_TITLES,
} from './constants';
import {
  createPdfFlow,
  drawSectionHeader,
  drawTextBlocks,
  drawValueBox,
} from './layout';
import { toPdfHeadingBlock, toPdfTextBlocks } from './markup-text';

/**
 * Краткие приметы боксами: мировоззрение и приметы внешности.
 *
 * @param sheet лист.
 * @returns подпись и значение каждого бокса.
 */
function getPersonalityBoxes(
  sheet: PdfSheet,
): Array<{ label: string; value: string }> {
  const { document } = sheet;

  return [
    { label: SHEET_LABELS.alignment, value: document.alignment },
    ...PERSONALITY_TRAIT_FIELDS.map((field) => ({
      label: field.label,
      value: document.personality[field.key],
    })),
  ];
}

/**
 * Тексты личности: черты характера, идеалы, привязанности и слабости
 * (PHB 2014), внешность и история — каждый под своим заголовком.
 *
 * @param sheet лист.
 * @returns блоки описания; пусто — тексты не заполнены.
 */
function getPersonalityBlocks(sheet: PdfSheet): PdfTextBlock[] {
  return PERSONALITY_TEXT_FIELDS.flatMap((field) => {
    const blocks = toPdfTextBlocks(sheet.document.personality[field.key]);

    return blocks.length ? [toPdfHeadingBlock(field.label), ...blocks] : [];
  });
}

/**
 * Страница личности: приметы с мировоззрением боксами и тексты личности прозой.
 * Предыстория сюда не идёт — она уже стоит в подзаголовке первой страницы
 * рядом с расой и классом.
 *
 * Страница не создаётся, пока личность не заполнена: пустые боксы под запись от
 * руки хороши на непустом листе, а целая страница ради них — нет.
 *
 * @param context документ в процессе сборки.
 * @param sheet лист.
 */
export function drawPersonalityPage(
  context: PdfBuildContext,
  sheet: PdfSheet,
): void {
  const boxes = getPersonalityBoxes(sheet);
  const descriptionBlocks = getPersonalityBlocks(sheet);

  if (!boxes.some((box) => box.value.trim()) && !descriptionBlocks.length) {
    return;
  }

  const flow = createPdfFlow(context, {
    left: PDF_PAGE_MARGIN,
    width: PDF_CONTENT_WIDTH,
    top: PDF_PAGE_MARGIN,
  });

  drawSectionHeader(context, flow, PDF_TITLES.personality);

  const boxWidth =
    (flow.width - PDF_GAP * (PDF_PERSONALITY_COLUMNS - 1))
    / PDF_PERSONALITY_COLUMNS;

  for (const [index, box] of boxes.entries()) {
    const column = index % PDF_PERSONALITY_COLUMNS;
    const line = Math.floor(index / PDF_PERSONALITY_COLUMNS);

    drawValueBox(context, flow.page, {
      left: flow.left + (boxWidth + PDF_GAP) * column,
      top: flow.top + (PDF_PERSONALITY_BOX_HEIGHT + PDF_GAP) * line,
      width: boxWidth,
      height: PDF_PERSONALITY_BOX_HEIGHT,
      label: box.label,
      value: box.value,
      // Кегль строки списка, а не крупного значения: мировоззрения целыми
      // словами («Хаотично-нейтральный») крупным кеглем в бокс не влезают.
      valueSize: PDF_FONT_SIZES.value,
    });
  }

  const lines = Math.ceil(boxes.length / PDF_PERSONALITY_COLUMNS);

  flow.advance((PDF_PERSONALITY_BOX_HEIGHT + PDF_GAP) * lines);

  if (!descriptionBlocks.length) {
    return;
  }

  flow.advance(PDF_GAP * 0.5);
  drawSectionHeader(context, flow, PDF_TITLES.personalityDescription);
  drawTextBlocks(context, flow, descriptionBlocks);
}
