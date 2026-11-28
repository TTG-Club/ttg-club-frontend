import type { PDFDocument } from 'pdf-lib';

import type { PdfFonts } from './types';

import fontkit from '@pdf-lib/fontkit';

import { PDF_FONT_LOAD_ERROR, PDF_FONT_URLS } from './constants';

/** Байты шрифтов по ключу начертания. */
type PdfFontBytes = Record<keyof PdfFonts, Uint8Array>;

/**
 * Скачанные файлы шрифтов: экспорт запускают повторно, а файлы весят под
 * полмегабайта каждый — второй раз их тянуть незачем.
 */
let cachedFontBytes: PdfFontBytes | null = null;

/**
 * Загрузка файла шрифта из `public`.
 *
 * @param url путь к файлу шрифта.
 * @returns байты шрифта.
 */
async function fetchFontBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${PDF_FONT_LOAD_ERROR} ${url}: ${response.status}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

/**
 * Байты всех начертаний с кэшем на время жизни страницы.
 *
 * @returns байты шрифтов по начертаниям.
 */
async function loadFontBytes(): Promise<PdfFontBytes> {
  if (cachedFontBytes) {
    return cachedFontBytes;
  }

  const [regular, bold, italic, display] = await Promise.all([
    fetchFontBytes(PDF_FONT_URLS.regular),
    fetchFontBytes(PDF_FONT_URLS.bold),
    fetchFontBytes(PDF_FONT_URLS.italic),
    fetchFontBytes(PDF_FONT_URLS.display),
  ]);

  cachedFontBytes = { regular, bold, italic, display };

  return cachedFontBytes;
}

/**
 * Встраивание шрифтов в документ. Встроенные в PDF шрифты (Helvetica и прочие)
 * кириллицу не содержат, поэтому начертания грузятся файлами и встраиваются
 * через fontkit. `subset` оставляет в документе только использованные глифы:
 * иначе четыре файла добавили бы к листу больше мегабайта.
 *
 * @param document документ листа.
 * @returns встроенные начертания.
 */
export async function loadPdfFonts(document: PDFDocument): Promise<PdfFonts> {
  document.registerFontkit(fontkit);

  const bytes = await loadFontBytes();

  // Копии байтов: один и тот же буфер встраивается в каждый новый документ, а
  // отдавать внутренностям pdf-lib ссылку на кэш — приглашение к порче кэша.
  const [regular, bold, italic, display] = await Promise.all([
    document.embedFont(bytes.regular.slice(), { subset: true }),
    document.embedFont(bytes.bold.slice(), { subset: true }),
    document.embedFont(bytes.italic.slice(), { subset: true }),
    document.embedFont(bytes.display.slice(), { subset: true }),
  ]);

  return { regular, bold, italic, display };
}
