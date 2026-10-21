import type { BackgroundDetail, SpellComponents, SpellDetail } from './schema';
import type { SpellComponentLabel } from './types';

import {
  CHARACTER_LIST_SEPARATOR,
  CHARACTER_NO_REQUIREMENTS,
  FEAT_TEXT,
  SPELL_COMPONENTS,
  SPELL_TEXT,
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

/**
 * Группа заклинания в списке: «Заговоры» или «3 уровень».
 * @param spell - заклинание из списка
 * @param spell.level - круг заклинания, 0 — заговор
 */
export function getSpellGroup(spell: { level: number }): string {
  return spell.level
    ? `${spell.level} ${SPELL_TEXT.level}`
    : SPELL_TEXT.cantrips;
}

/**
 * Подпись заклинания в плашке источника:
 * «3 уровень, воплощение [огонь] (ритуал)».
 * @param spell - заклинание
 */
export function getSpellTypeLabel(spell: SpellDetail): string {
  const level = spell.level
    ? `${spell.level} ${SPELL_TEXT.level}`
    : SPELL_TEXT.cantripLower;

  const additional = spell.additionalType ? ` [${spell.additionalType}]` : '';
  const ritual = spell.ritual ? ` (${SPELL_TEXT.ritual})` : '';

  return `${level}, ${spell.school}${additional}${ritual}`;
}

/**
 * Компоненты заклинания для карточки: только те, что есть, а у
 * материального — его описание в скобках.
 * @param components - компоненты из API
 */
export function getSpellComponentLabels(
  components?: SpellComponents | null,
): SpellComponentLabel[] {
  return SPELL_COMPONENTS.flatMap((component) => {
    const value = components?.[component.key];

    if (!value) {
      return [];
    }

    const detail = typeof value === 'string' ? ` (${value})` : '';

    return [
      {
        key: component.key,
        label: `${component.name}${detail}`,
        hint: component.hint,
      },
    ];
  });
}
