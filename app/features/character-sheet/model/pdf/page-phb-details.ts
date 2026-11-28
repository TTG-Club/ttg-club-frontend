import type { PDFPage } from 'pdf-lib';

import type { PdfBuildContext, PdfRect, PdfSheet } from './types';

import { PDF_CONTENT_WIDTH, PDF_PAGE_MARGIN } from './constants';
import { getPdfInventoryGroups } from './data';
import { createPdfPage } from './layout';
import {
  getPhbFeatureLines,
  getPhbMainFeatureCapacity,
  getPhbParagraphs,
} from './page-phb-main';
import {
  PHB_ALLIES_NOTE_PREFIX,
  PHB_BODY_BOTTOM,
  PHB_BODY_TOP,
  PHB_COLUMN_GAP,
  PHB_DETAILS,
  PHB_GAP,
  PHB_LABELS,
  PHB_PADDING,
} from './phb-constants';
import {
  drawPhbBanner,
  drawPhbBox,
  drawPhbCaption,
  drawPhbHeaderFields,
  drawPhbLinedText,
  drawPhbPanel,
} from './phb-layout';

/**
 * Заметки о союзниках: в листе 5e14 отдельного поля нет, поэтому сюда идут
 * заметки, название которых начинается с «Союзник…».
 *
 * @param sheet лист.
 * @returns абзацы заметок о союзниках.
 */
function getAllyParagraphs(sheet: PdfSheet): string[] {
  return sheet.document.notes
    .filter((note) =>
      note.title.trim().toLowerCase().startsWith(PHB_ALLIES_NOTE_PREFIX),
    )
    .flatMap((note) => getPhbParagraphs(note.text));
}

/**
 * Сокровища: магические предметы и свои валюты.
 *
 * @param sheet лист.
 * @returns строки списка сокровищ.
 */
function getTreasureLines(sheet: PdfSheet): string[] {
  const magicItems =
    getPdfInventoryGroups(sheet).find((group) => group.key === 'magic')?.items
    ?? [];

  return [
    ...magicItems.map((item) =>
      item.quantity > 1 ? `${item.name} ×${item.quantity}` : item.name,
    ),
    ...sheet.document.customCurrencies.map(
      (currency) => `${currency.name}: ${currency.amount}`,
    ),
  ];
}

/**
 * Рамка внешнего вида: портрет, вписанный с сохранением пропорций.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param rect геометрия рамки.
 */
function drawAppearance(
  context: PdfBuildContext,
  page: PDFPage,
  rect: PdfRect,
): void {
  const area = drawPhbPanel(context, page, rect, PHB_LABELS.appearance);
  const { portrait } = context;

  if (!portrait) {
    return;
  }

  const scale = Math.min(
    area.width / portrait.width,
    area.height / portrait.height,
  );

  const width = portrait.width * scale;
  const height = portrait.height * scale;

  page.drawImage(portrait, {
    x: area.left + (area.width - width) / 2,
    y: page.getHeight() - area.top - (area.height + height) / 2,
    width,
    height,
  });
}

/**
 * Союзники и организации: две колонки линовки и врезка под название и символ
 * справа.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param sheet лист.
 * @param rect геометрия панели.
 */
function drawAllies(
  context: PdfBuildContext,
  page: PDFPage,
  sheet: PdfSheet,
  rect: PdfRect,
): void {
  const area = drawPhbPanel(context, page, rect, PHB_LABELS.allies);
  const emblemLeft = area.left + area.width - PHB_DETAILS.emblemWidth;

  drawPhbLinedText(
    context,
    page,
    {
      left: area.left,
      top: area.top,
      width: emblemLeft - area.left - PHB_GAP,
      height: area.height,
    },
    { paragraphs: getAllyParagraphs(sheet), columns: 2 },
  );

  const emblemHeight = area.height * 0.62;

  drawPhbBox(page, {
    left: emblemLeft,
    top: area.top,
    width: PHB_DETAILS.emblemWidth,
    height: emblemHeight,
  });

  drawPhbCaption(context, page, {
    text: PHB_LABELS.emblem,
    left: emblemLeft,
    top: area.top + emblemHeight + 3,
    width: PHB_DETAILS.emblemWidth,
  });
}

/**
 * Страница персонажа листа «как в Книге игрока»: приметы, внешний вид,
 * союзники, предыстория, продолжение особенностей и сокровища.
 *
 * @param context документ в процессе сборки.
 * @param sheet лист.
 */
export function drawPhbDetailsPage(
  context: PdfBuildContext,
  sheet: PdfSheet,
): void {
  const page = createPdfPage(context);
  const { personality } = sheet.document;

  drawPhbBanner(context, page, {
    label: PHB_LABELS.characterName,
    value: sheet.name,
  });

  drawPhbHeaderFields(context, page, [
    { label: PHB_LABELS.age, value: personality.age },
    { label: PHB_LABELS.height, value: personality.height },
    { label: PHB_LABELS.weight, value: personality.weight },
    { label: PHB_LABELS.eyes, value: personality.eyes },
    { label: PHB_LABELS.skin, value: personality.skin },
    { label: PHB_LABELS.hair, value: personality.hair },
  ]);

  const left = PDF_PAGE_MARGIN;
  const leftWidth = PHB_DETAILS.leftWidth;
  const rightLeft = left + leftWidth + PHB_COLUMN_GAP;
  const rightWidth = PDF_CONTENT_WIDTH - leftWidth - PHB_COLUMN_GAP;

  drawAppearance(context, page, {
    left,
    top: PHB_BODY_TOP,
    width: leftWidth,
    height: PHB_DETAILS.topHeight,
  });

  drawAllies(context, page, sheet, {
    left: rightLeft,
    top: PHB_BODY_TOP,
    width: rightWidth,
    height: PHB_DETAILS.topHeight,
  });

  const lowerTop = PHB_BODY_TOP + PHB_DETAILS.topHeight + PHB_GAP;

  const backstoryArea = drawPhbPanel(
    context,
    page,
    {
      left,
      top: lowerTop,
      width: leftWidth,
      height: PHB_BODY_BOTTOM - lowerTop,
    },
    PHB_LABELS.backstory,
  );

  drawPhbLinedText(context, page, backstoryArea, {
    paragraphs: [
      ...getPhbParagraphs(personality.backstory),
      ...getPhbParagraphs(personality.appearance),
    ],
  });

  const treasureTop = PHB_BODY_BOTTOM - PHB_DETAILS.treasureHeight;

  const featuresArea = drawPhbPanel(
    context,
    page,
    {
      left: rightLeft,
      top: lowerTop,
      width: rightWidth,
      height: treasureTop - PHB_GAP - lowerTop,
    },
    PHB_LABELS.extraFeatures,
  );

  drawPhbLinedText(context, page, featuresArea, {
    paragraphs: getPhbFeatureLines(sheet).slice(getPhbMainFeatureCapacity()),
    isList: true,
    columns: 2,
  });

  const treasureArea = drawPhbPanel(
    context,
    page,
    {
      left: rightLeft,
      top: treasureTop,
      width: rightWidth,
      height: PHB_DETAILS.treasureHeight,
    },
    PHB_LABELS.treasure,
  );

  drawPhbLinedText(
    context,
    page,
    { ...treasureArea, height: treasureArea.height - PHB_PADDING },
    { paragraphs: getTreasureLines(sheet), isList: true, columns: 2 },
  );
}
