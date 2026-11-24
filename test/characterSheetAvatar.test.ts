import { describe, expect, it } from 'vitest';

import {
  clampCropArea,
  createEmptySheetDocument,
  createInitialCropArea,
  getCroppedFileName,
  parseSheetImport,
  resizeCropArea,
  resizeCropAreaFromCenter,
  sheetDocumentSchema,
  withoutSheetAvatar,
} from '~character-sheet/model';

const landscape = { width: 400, height: 200 };

describe('портрет: область выбора', () => {
  it('начальная область — наибольший квадрат по центру', () => {
    expect(createInitialCropArea(landscape)).toEqual({
      x: 100,
      y: 0,
      size: 200,
    });
  });

  it('область не выходит за картинку и не мельче минимума', () => {
    expect(clampCropArea({ x: 390, y: -5, size: 10 }, landscape)).toEqual({
      x: 352,
      y: 0,
      size: 48,
    });
  });

  it('угол тянет область, противоположный угол стоит на месте', () => {
    const start = { x: 100, y: 50, size: 100 };

    expect(
      resizeCropArea(start, 'topLeft', { x: -30, y: -10 }, landscape),
    ).toEqual({ x: 70, y: 20, size: 130 });

    // Дальше края картинки область не растёт
    expect(
      resizeCropArea(start, 'bottomRight', { x: 500, y: 500 }, landscape),
    ).toEqual({ x: 100, y: 50, size: 150 });
  });

  it('ползунок меняет сторону, сохраняя центр', () => {
    expect(
      resizeCropAreaFromCenter({ x: 100, y: 50, size: 100 }, 60, landscape),
    ).toEqual({ x: 120, y: 70, size: 60 });
  });

  it('имя файла получает расширение по типу результата', () => {
    expect(getCroppedFileName('Торин.jpg', 'image/webp')).toBe('Торин.webp');
    expect(getCroppedFileName('  .jpg', 'image/png')).toBe('portrait.png');
  });
});

describe('портрет: документ листа', () => {
  it('принимает только адреса хранилища сайта', () => {
    expect(
      sheetDocumentSchema.parse({
        avatarUrl: '/s3/5e14/character-sheets/a.webp?v=1',
      }).avatarUrl,
    ).toBe('/s3/5e14/character-sheets/a.webp?v=1');

    expect(
      sheetDocumentSchema.parse({ avatarUrl: 'https://evil.example/x.png' })
        .avatarUrl,
    ).toBeNull();

    expect(createEmptySheetDocument().avatarUrl).toBeNull();
  });

  it('импорт отбрасывает портрет чужого листа', () => {
    const result = parseSheetImport(
      JSON.stringify({
        name: 'Торин',
        data: { avatarUrl: '/s3/5e14/character-sheets/other.webp' },
      }),
      'файл',
    );

    expect(result.success && result.sheet.data.avatarUrl).toBeNull();
  });

  it('копия и экспорт идут без портрета', () => {
    const document = {
      ...createEmptySheetDocument(),
      avatarUrl: '/s3/5e14/character-sheets/a.webp',
    };

    expect(withoutSheetAvatar(document).avatarUrl).toBeNull();
    expect(document.avatarUrl).toBe('/s3/5e14/character-sheets/a.webp');
  });
});
