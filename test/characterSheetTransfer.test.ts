import { describe, expect, it } from 'vitest';

import {
  createEmptySheetDocument,
  getSheetExportFileName,
  getSheetNameFromFileName,
  parseSheetImport,
  SHEET_TEXT,
} from '~character-sheet/model';

describe('parseSheetImport', () => {
  it('принимает файл нашего экспорта { name, data }', () => {
    const data = { ...createEmptySheetDocument(), experience: 900 };

    const result = parseSheetImport(
      JSON.stringify({ name: 'Арагорн', data }),
      'файл',
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.sheet.name).toBe('Арагорн');
      expect(result.sheet.data.experience).toBe(900);
    }
  });

  it('берёт запасное имя, если в экспорте его нет', () => {
    const result = parseSheetImport(
      JSON.stringify({ name: '  ', data: { experience: 300 } }),
      'гимли',
    );

    expect(result.success && result.sheet.name).toBe('гимли');
  });

  it('принимает голый документ листа и чинит мусорные поля', () => {
    const result = parseSheetImport(
      JSON.stringify({ experience: 'много', inspiration: true }),
      '',
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.sheet.name).toBe(SHEET_TEXT.defaultName);
      expect(result.sheet.data.experience).toBe(0);
      expect(result.sheet.data.inspiration).toBe(true);
    }
  });

  it('отклоняет не-JSON', () => {
    expect(parseSheetImport('{ не json', 'x')).toEqual({
      success: false,
      error: 'invalidJson',
    });
  });

  it('отклоняет чужой JSON', () => {
    expect(parseSheetImport('{"foo": 1}', 'x')).toEqual({
      success: false,
      error: 'invalidFormat',
    });

    expect(parseSheetImport('[1, 2]', 'x')).toEqual({
      success: false,
      error: 'invalidFormat',
    });

    expect(parseSheetImport('null', 'x')).toEqual({
      success: false,
      error: 'invalidFormat',
    });
  });
});

describe('имена файлов листа', () => {
  it('убирает расширение .json из имени файла', () => {
    expect(getSheetNameFromFileName('Леголас.json')).toBe('Леголас');
    expect(getSheetNameFromFileName('Леголас')).toBe('Леголас');
  });

  it('заменяет недопустимые символы в имени файла экспорта', () => {
    expect(getSheetExportFileName('Боромир: сын/наместника')).toBe(
      'Боромир_ сын_наместника.json',
    );

    expect(getSheetExportFileName('')).toBe(`${SHEET_TEXT.defaultName}.json`);
  });
});
