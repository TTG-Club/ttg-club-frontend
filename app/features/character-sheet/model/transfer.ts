import type { CharacterSheet, SheetDocument } from './schema';

import { z } from 'zod';

import {
  SHEET_EXPORT_FILE,
  SHEET_FILE_NAME_FORBIDDEN,
  SHEET_TEXT,
} from './constants';
import { sheetDocumentSchema } from './schema';

/** Лист, прочитанный из файла импорта: имя и документ. */
export interface SheetImportData {
  name: string;
  data: SheetDocument;
}

/** Почему файл не удалось импортировать: не JSON или не лист. */
export type SheetImportError = 'invalidJson' | 'invalidFormat';

/** Итог разбора файла импорта. */
export type SheetImportResult =
  | { success: true; sheet: SheetImportData }
  | { success: false; error: SheetImportError };

/** Произвольный JSON-объект (не массив и не примитив). */
const jsonObjectSchema = z.record(z.string(), z.unknown());

/** Файл нашего экспорта: имя и документ листа. */
const sheetExportSchema = z.object({
  name: z.string().optional().catch(undefined),
  data: jsonObjectSchema,
});

/** Поля документа листа: по ним голый документ отличается от чужого JSON. */
const SHEET_DOCUMENT_KEYS = new Set(Object.keys(sheetDocumentSchema.shape));

/**
 * Разбирает JSON-текст без исключения.
 * @param text - содержимое файла
 * @returns разобранное значение или `undefined`, если это не JSON
 */
function parseJsonSafely(text: string): unknown {
  try {
    const parsed: unknown = JSON.parse(text);

    return parsed;
  } catch {
    return undefined;
  }
}

/**
 * Имя листа из файла: своё имя файла экспорта или запасное.
 * @param name - имя из файла
 * @param fallbackName - запасное имя (например, имя файла)
 */
function getImportName(name: string | undefined, fallbackName: string): string {
  const trimmed = name?.trim();

  if (trimmed) {
    return trimmed;
  }

  return fallbackName.trim() || SHEET_TEXT.defaultName;
}

/**
 * Разбирает файл импорта листа. Принимает файл нашего экспорта
 * (`{ name, data }`) или голый документ листа; документ проходит мягкую
 * схему, поэтому непонятные поля получают начальные значения.
 * @param text - содержимое файла
 * @param fallbackName - имя листа, если в файле его нет
 * @returns лист для создания или причина отказа
 */
export function parseSheetImport(
  text: string,
  fallbackName: string,
): SheetImportResult {
  const parsed = parseJsonSafely(text);

  if (parsed === undefined) {
    return { success: false, error: 'invalidJson' };
  }

  const exported = sheetExportSchema.safeParse(parsed);

  if (exported.success) {
    return {
      success: true,
      sheet: {
        name: getImportName(exported.data.name, fallbackName),
        data: sheetDocumentSchema.parse(exported.data.data),
      },
    };
  }

  const bareDocument = jsonObjectSchema.safeParse(parsed);

  if (
    !bareDocument.success
    || !Object.keys(bareDocument.data).some((key) =>
      SHEET_DOCUMENT_KEYS.has(key),
    )
  ) {
    return { success: false, error: 'invalidFormat' };
  }

  return {
    success: true,
    sheet: {
      name: getImportName(undefined, fallbackName),
      data: sheetDocumentSchema.parse(bareDocument.data),
    },
  };
}

/**
 * Имя листа из имени файла: без расширения `.json`.
 * @param fileName - имя выбранного файла
 */
export function getSheetNameFromFileName(fileName: string): string {
  return fileName.endsWith(SHEET_EXPORT_FILE.extension)
    ? fileName.slice(0, -SHEET_EXPORT_FILE.extension.length)
    : fileName;
}

/**
 * Имя файла экспорта листа: имя персонажа без недопустимых символов.
 * @param name - имя персонажа
 */
export function getSheetExportFileName(name: string): string {
  const safeName =
    name.replace(SHEET_FILE_NAME_FORBIDDEN, '_').trim()
    || SHEET_TEXT.defaultName;

  return `${safeName}${SHEET_EXPORT_FILE.extension}`;
}

/**
 * Скачивает лист JSON-файлом `{ name, data }` — его же принимает импорт.
 * @param sheet - лист персонажа
 */
export function downloadSheetJson(sheet: CharacterSheet): void {
  const content = JSON.stringify(
    { name: sheet.name, data: sheet.data },
    null,
    SHEET_EXPORT_FILE.indent,
  );

  const url = URL.createObjectURL(
    new Blob([content], { type: SHEET_EXPORT_FILE.mimeType }),
  );

  const link = document.createElement('a');

  link.href = url;
  link.download = getSheetExportFileName(sheet.name);
  link.click();

  URL.revokeObjectURL(url);
}
