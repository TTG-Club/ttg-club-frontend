import type { BackgroundDetail } from './schema';

import {
  CHARACTER_LIST_SEPARATOR,
  CHARACTER_NO_REQUIREMENTS,
  FEAT_TEXT,
} from './constants';

/**
 * Подпись требований черты или особенности для плашки источника.
 * @param requirements - требования из API
 */
export function getRequirementsLabel(requirements?: string | null): string {
  return `${FEAT_TEXT.requirements} ${requirements || CHARACTER_NO_REQUIREMENTS}`;
}

/**
 * Языки предыстории: списком, а у старых записей — одной строкой.
 * @param background - предыстория
 */
export function getBackgroundLanguages(background: BackgroundDetail): string {
  return background.languages?.length
    ? background.languages.join(CHARACTER_LIST_SEPARATOR)
    : (background.language ?? '');
}

/**
 * Есть ли у предыстории блок персонализации: текст или таблицы.
 * @param background - предыстория
 */
export function hasPersonalization(background: BackgroundDetail): boolean {
  return Boolean(
    background.personalization || background.personalizationTables?.length,
  );
}
