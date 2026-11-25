import type { ExternalImportResult, LssCharacter } from './types';

import { SHEET_TEXT } from '../constants';
import { linkLssCatalog } from './catalog';
import { LSS_IMPORT_WARNINGS, LSS_SOURCE_LABEL } from './constants';
import { convertLssCharacter } from './convert';
import { parseLssDocument } from './schema';

/**
 * Что из файла не переехало: молчать нельзя — пропажа обнаружится посреди
 * игры.
 * @param source - персонаж LSS
 */
function getWarnings(source: LssCharacter): Array<string> {
  const warnings: Array<string> = [];

  const hasSpellcasting =
    Boolean(source.spellcastingAbility)
    || [...source.spellSlots, ...source.pactSpellSlots].some(
      (slot) => slot.max > 0,
    );

  if (hasSpellcasting) {
    warnings.push(LSS_IMPORT_WARNINGS.spells);
  }

  if (source.hasBonuses) {
    warnings.push(LSS_IMPORT_WARNINGS.bonuses);
  }

  if (source.hasAttunements) {
    warnings.push(LSS_IMPORT_WARNINGS.attunements);
  }

  return warnings;
}

/**
 * Импорт листа из файла чужого формата. Сейчас — Long Story Short; для
 * остальных файлов null, и импорт читает их как свой экспорт.
 * @param input - разобранное содержимое JSON-файла
 * @param fallbackName - имя листа, если в файле его нет
 */
export async function importExternalSheet(
  input: unknown,
  fallbackName: string,
): Promise<ExternalImportResult | null> {
  const source = parseLssDocument(input);

  if (!source) {
    return null;
  }

  const data = await linkLssCatalog(convertLssCharacter(source), source);

  return {
    sheet: {
      name: source.name || fallbackName.trim() || SHEET_TEXT.defaultName,
      data,
    },
    sourceLabel: LSS_SOURCE_LABEL,
    warnings: getWarnings(source),
  };
}
