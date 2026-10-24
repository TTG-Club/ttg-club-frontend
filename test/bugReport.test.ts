import { describe, expect, it } from 'vitest';

import {
  fitImageSize,
  formatSelectionText,
  getScreenshotFileName,
  getSelectionContext,
  isBugReportType,
  SELECTION_CONTEXT_LENGTH,
} from '~bug-report/model';

describe('баг-репорт', () => {
  it('берёт окружение выделенного текста', () => {
    const before = 'а'.repeat(SELECTION_CONTEXT_LENGTH + 10);

    expect(getSelectionContext(`${before}ошибка хвост`, 'ошибка')).toEqual({
      before: 'а'.repeat(SELECTION_CONTEXT_LENGTH),
      selected: 'ошибка',
      after: ' хвост',
    });

    expect(getSelectionContext('другой текст', 'ошибка')).toEqual({
      before: '',
      selected: 'ошибка',
      after: '',
    });
  });

  it('склеивает выделение с окружением', () => {
    expect(
      formatSelectionText({ before: 'до ', selected: 'это', after: ' после' }),
    ).toBe('...до [это] после...');

    expect(
      formatSelectionText({ before: '', selected: 'это', after: '' }),
    ).toBe('[это]');
  });

  it('называет скриншот по настоящему формату', () => {
    expect(getScreenshotFileName(new Blob([], { type: 'image/webp' }))).toBe(
      'screenshot.webp',
    );

    expect(getScreenshotFileName(new Blob([], { type: 'image/png' }))).toBe(
      'screenshot.png',
    );
  });

  it('вписывает скриншот в окно, не увеличивая', () => {
    expect(
      fitImageSize({ width: 2000, height: 1000 }, { width: 1000, height: 800 }),
    ).toEqual({ width: 1000, height: 500 });

    expect(
      fitImageSize({ width: 400, height: 300 }, { width: 1000, height: 800 }),
    ).toEqual({ width: 400, height: 300 });
  });

  it('узнаёт тип записи по значению вкладки', () => {
    expect(isBugReportType('BUG')).toBe(true);
    expect(isBugReportType('WISH')).toBe(true);
    expect(isBugReportType('wish')).toBe(false);
    expect(isBugReportType(0)).toBe(false);
  });
});
