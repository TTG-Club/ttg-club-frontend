import type {
  PdfBuildContext,
  PdfBuildOptions,
  PdfSheet,
  PdfSheetSource,
  SheetPdfVariant,
} from './types';

import { PDFDocument } from 'pdf-lib';

import {
  SHEET_FILE_NAME_FORBIDDEN,
  SHEET_PDF_FILE,
  SHEET_TEXT,
} from '../constants';
import { loadPdfCatalog } from './catalog';
import { PDF_DEFAULT_VARIANT, PDF_META } from './constants';
import { createPdfSheet } from './data';
import { loadPdfFonts } from './fonts';
import { drawPdfFooters } from './layout';
import { drawEquipmentPage } from './page-equipment';
import { drawMainPage } from './page-main';
import { drawPersonalityPage } from './page-personality';
import { drawReferencePage } from './page-reference';
import { drawSpellsPage } from './page-spells';

/** Отрисовка страницы листа. */
type PdfPageDrawer = (context: PdfBuildContext, sheet: PdfSheet) => void;

/**
 * Страницы каждого вида листа по порядку; справочник идёт после них у любого
 * вида. Страница, которой нечего показать, сама себя не создаёт.
 */
const PDF_VARIANT_PAGES: Record<SheetPdfVariant, PdfPageDrawer[]> = {
  ttg: [drawMainPage, drawPersonalityPage, drawEquipmentPage, drawSpellsPage],
};

/**
 * Сборка PDF листа персонажа. Первая страница — основной лист, дальше
 * личность, снаряжение, заклинания и справочник с полными описаниями;
 * страницы, которым нечего показать, не создаются.
 *
 * Всё, что есть в документе листа, считается теми же функциями, что и лист на
 * сайте, поэтому экспорт одинаково работает и из открытого листа, и из
 * карточки списка. Карточки классов (ячейки заклинаний, умения по уровням),
 * заклинаний и предметов в документе не хранятся — их дозагружает
 * `loadPdfCatalog`; отказ запроса лишает лист одной записи, но не срывает
 * экспорт.
 *
 * Если у листа включён доступ по ссылке, в шапку первой страницы ставится
 * QR-код с этой ссылкой — бумажный лист ведёт к актуальной версии на сайте.
 *
 * @param source имя и документ листа.
 * @param options ссылка на просмотр листа, вид листа и прочее, чего нет в документе.
 * @returns байты готового PDF.
 */
export async function buildCharacterSheetPdf(
  source: PdfSheetSource,
  options: PdfBuildOptions = {},
): Promise<Uint8Array> {
  const document = await PDFDocument.create();

  document.setTitle(`${source.name} — ${SHEET_TEXT.title}`);
  document.setAuthor(source.name);
  document.setCreator(PDF_META.creator);
  document.setProducer(PDF_META.producer);
  document.setSubject(PDF_META.subject);

  // Шрифты и справочник тянутся параллельно: и то и другое — сеть, а рисовать
  // всё равно нечем, пока не встроены шрифты.
  const [fonts, catalog] = await Promise.all([
    loadPdfFonts(document),
    loadPdfCatalog(source.document),
  ]);

  const context: PdfBuildContext = {
    document,
    fonts,
    characterName: source.name,
    pages: [],
    shareUrl: options.shareUrl ?? null,
  };

  const sheet = createPdfSheet(source, catalog);

  // Вид листа выбирает набор страниц; справочник и колонтитулы общие.
  for (const drawPage of PDF_VARIANT_PAGES[
    options.variant ?? PDF_DEFAULT_VARIANT
  ]) {
    drawPage(context, sheet);
  }

  drawReferencePage(context, sheet);

  // Колонтитулы в самом конце: до этого момента общее число страниц неизвестно.
  drawPdfFooters(context);

  return document.save();
}

/**
 * Имя файла листа в PDF: имя персонажа без запрещённых в файловой системе
 * символов.
 *
 * @param name имя персонажа.
 * @returns имя файла с расширением.
 */
export function getSheetPdfFileName(name: string): string {
  const safeName =
    name.replace(SHEET_FILE_NAME_FORBIDDEN, '_').trim()
    || SHEET_TEXT.defaultName;

  return `${safeName}${SHEET_PDF_FILE.extension}`;
}

/**
 * Сборка и скачивание листа в PDF.
 *
 * @param source имя и документ листа.
 * @param options ссылка для QR-кода и вид листа.
 */
export async function downloadCharacterSheetPdf(
  source: PdfSheetSource,
  options: PdfBuildOptions = {},
): Promise<void> {
  const bytes = await buildCharacterSheetPdf(source, options);

  // Копия байтов в свежий массив: `Blob` принимает только представления над
  // `ArrayBuffer`, а pdf-lib отдаёт массив над `ArrayBufferLike`.
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(bytes)], { type: SHEET_PDF_FILE.mimeType }),
  );

  const link = window.document.createElement('a');

  link.href = url;
  link.download = getSheetPdfFileName(source.name);
  link.click();

  URL.revokeObjectURL(url);
}
