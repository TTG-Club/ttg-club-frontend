import type { TextSelection } from './types';

import {
  SCREENSHOT_EXPORT_MIME,
  SCREENSHOT_FILE_NAME,
  SELECTION_CONTEXT_LENGTH,
} from './constants';

/**
 * Выделенный текст с окружением одной строкой: `...до[выделено]после...`.
 * @param selection - выделение
 */
export function formatSelectionText(selection: TextSelection): string {
  const prefix = selection.before ? `...${selection.before}` : '';
  const suffix = selection.after ? `${selection.after}...` : '';

  return `${prefix}[${selection.selected}]${suffix}`;
}

/**
 * Окружение выделенного текста внутри текста его блока.
 * @param fullText - весь текст блока
 * @param selected - выделенный текст
 */
export function getSelectionContext(
  fullText: string,
  selected: string,
): TextSelection {
  const start = fullText.indexOf(selected);

  if (start === -1) {
    return { before: '', selected, after: '' };
  }

  const end = start + selected.length;

  return {
    before: fullText.slice(
      Math.max(0, start - SELECTION_CONTEXT_LENGTH),
      start,
    ),
    selected,
    after: fullText.slice(end, end + SELECTION_CONTEXT_LENGTH),
  };
}

/**
 * Имя файла скриншота по его настоящему формату.
 * @param blob - выгруженный скриншот
 */
export function getScreenshotFileName(blob: Blob): string {
  return blob.type === SCREENSHOT_EXPORT_MIME
    ? SCREENSHOT_FILE_NAME.webp
    : SCREENSHOT_FILE_NAME.png;
}

/**
 * Размер скриншота на экране: вписан в окно, но не крупнее оригинала.
 * @param natural - размер картинки
 * @param natural.width - ширина
 * @param natural.height - высота
 * @param max - свободное место
 * @param max.width - ширина
 * @param max.height - высота
 */
export function fitImageSize(
  natural: { width: number; height: number },
  max: { width: number; height: number },
): { width: number; height: number } {
  const scale = Math.min(
    1,
    max.width / natural.width,
    max.height / natural.height,
  );

  return {
    width: Math.floor(natural.width * scale),
    height: Math.floor(natural.height * scale),
  };
}
