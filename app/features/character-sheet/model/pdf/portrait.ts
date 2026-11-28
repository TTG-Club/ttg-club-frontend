import type { PDFDocument, PDFImage } from 'pdf-lib';

import { PHB_PORTRAIT_SIGNATURES } from './phb-constants';

/**
 * Начинаются ли байты с сигнатуры формата.
 *
 * @param bytes байты файла.
 * @param signature сигнатура формата.
 * @returns true — формат совпал.
 */
function hasSignature(
  bytes: Uint8Array,
  signature: ReadonlyArray<number>,
): boolean {
  return signature.every((byte, index) => bytes[index] === byte);
}

/**
 * Перекодирует картинку в PNG средствами браузера: pdf-lib встраивает только
 * PNG и JPEG, а портреты листа хранятся и в WebP. Вне браузера (или без
 * `OffscreenCanvas`) перекодировать нечем.
 *
 * @param bytes байты картинки.
 * @returns байты PNG или null, если перекодировать не вышло.
 */
async function convertToPng(bytes: Uint8Array): Promise<Uint8Array | null> {
  if (
    typeof createImageBitmap !== 'function'
    || typeof OffscreenCanvas !== 'function'
  ) {
    return null;
  }

  const bitmap = await createImageBitmap(new Blob([new Uint8Array(bytes)]));
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const drawing = canvas.getContext('2d');

  if (!drawing) {
    return null;
  }

  drawing.drawImage(bitmap, 0, 0);

  const png = await canvas.convertToBlob({ type: 'image/png' });

  return new Uint8Array(await png.arrayBuffer());
}

/**
 * Портрет персонажа для листа «как в Книге игрока». Отказ любой ступени —
 * загрузки, разбора или перекодирования — оставляет рамку внешности пустой,
 * но не срывает экспорт.
 *
 * @param document документ листа PDF.
 * @param url адрес портрета; null — портрета нет.
 * @returns встроенная картинка или null.
 */
export async function loadPdfPortrait(
  document: PDFDocument,
  url: string | null,
): Promise<PDFImage | null> {
  if (!url) {
    return null;
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const bytes = new Uint8Array(await response.arrayBuffer());

    if (hasSignature(bytes, PHB_PORTRAIT_SIGNATURES.png)) {
      return await document.embedPng(bytes);
    }

    if (hasSignature(bytes, PHB_PORTRAIT_SIGNATURES.jpeg)) {
      return await document.embedJpg(bytes);
    }

    const png = await convertToPng(bytes);

    return png ? await document.embedPng(png) : null;
  } catch {
    return null;
  }
}
