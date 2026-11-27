import type { PDFPage } from 'pdf-lib';

import type { PdfRect } from './types';

import { rgb } from 'pdf-lib';
import { encode } from 'uqr';

import { PDF_PAGE_HEIGHT } from './constants';

/** Параметры QR-кода: квадрат `width` × `width`, высота равна ширине. */
export type PdfQrOptions = Omit<PdfRect, 'height'> & {
  /** Кодируемый текст — ссылка на лист. */
  text: string;
};

/**
 * QR-код векторными квадратами: картинка в документ не встраивается, поэтому
 * код остаётся чётким при любой печати и почти не прибавляет файлу веса.
 *
 * Уровень коррекции `M` — компромисс между плотностью (код мелкий, крупные
 * модули сканируются надёжнее) и устойчивостью к помятой или затёртой печати.
 * Белое поле в один модуль — минимум, при котором камера отделяет код от
 * соседней рамки.
 *
 * @param page страница.
 * @param options место под код и кодируемый текст.
 */
export function drawPdfQrCode(page: PDFPage, options: PdfQrOptions): void {
  const { data, size } = encode(options.text, { ecc: 'M', border: 1 });

  const moduleSize = options.width / size;
  const black = rgb(0, 0, 0);

  page.drawRectangle({
    x: options.left,
    y: PDF_PAGE_HEIGHT - options.top - options.width,
    width: options.width,
    height: options.width,
    color: rgb(1, 1, 1),
  });

  for (const [row, cells] of data.entries()) {
    // Подряд идущие тёмные модули строки — один прямоугольник: так в документе
    // в разы меньше операций, а на стыках не просвечивают волосяные щели.
    let runStart = -1;

    for (let column = 0; column <= size; column++) {
      const isDark = column < size && cells[column];

      if (isDark && runStart < 0) {
        runStart = column;
      } else if (!isDark && runStart >= 0) {
        page.drawRectangle({
          x: options.left + runStart * moduleSize,
          y: PDF_PAGE_HEIGHT - options.top - (row + 1) * moduleSize,
          width: (column - runStart) * moduleSize,
          height: moduleSize,
          color: black,
        });

        runStart = -1;
      }
    }
  }
}
