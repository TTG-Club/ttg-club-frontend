import type { SheetDocument } from './schema';
import type { PreparedLimit, PreparedLimitClass } from './types';

import { PREPARED_CASTER_PROGRESSION } from './constants';
import { getClassSlug } from './levelUp';
import { getAbilityModifier } from './utils';

/*
 * Предел подготовленных заклинаний по правилам 2014: у жреца, друида и
 * волшебника — модификатор базовой характеристики плюс уровень класса, у
 * паладина — плюс половина уровня (вниз), у изобретателя — половина вверх;
 * не меньше одного. Классы с известными заклинаниями (бард, колдун,
 * чародей, следопыт) ограничены колонкой «Известные заклинания» таблицы
 * класса. Свой предел игрока важнее расчёта.
 */

/**
 * Часть предела от уровня класса по виду подготовки.
 * @param progression - вид подготовки класса
 * @param level - уровень класса
 */
function getPreparedLevelPart(
  progression: 'full' | 'half' | 'halfUp',
  level: number,
): number {
  if (progression === 'full') {
    return level;
  }

  return progression === 'half' ? Math.floor(level / 2) : Math.ceil(level / 2);
}

/**
 * Предел подготовленных или известных заклинаний персонажа.
 * @param document - лист персонажа
 * @param classes - классы листа с колонкой известных заклинаний
 * @param abilityScore - значение базовой характеристики заклинаний
 */
export function getPreparedLimit(
  document: SheetDocument,
  classes: ReadonlyArray<PreparedLimitClass>,
  abilityScore: number | null,
): PreparedLimit {
  const prepared = document.spells.filter(
    (spell) => spell.level > 0 && spell.isPrepared && !spell.alwaysPrepared,
  ).length;

  if (document.preparedLimitOverride !== null) {
    return { value: document.preparedLimitOverride, prepared, isKnown: false };
  }

  const modifier = abilityScore === null ? 0 : getAbilityModifier(abilityScore);

  let preparedTotal: number | null = null;
  let knownTotal: number | null = null;

  for (const sheetClass of classes) {
    const progression =
      PREPARED_CASTER_PROGRESSION[getClassSlug(sheetClass.url)];

    if (progression) {
      preparedTotal =
        (preparedTotal ?? 0)
        + Math.max(
          1,
          modifier + getPreparedLevelPart(progression, sheetClass.level),
        );
    } else if (sheetClass.knownSpells !== null) {
      knownTotal = (knownTotal ?? 0) + sheetClass.knownSpells;
    }
  }

  if (preparedTotal !== null) {
    return {
      value: preparedTotal + (knownTotal ?? 0),
      prepared,
      isKnown: false,
    };
  }

  if (knownTotal !== null) {
    return {
      value: knownTotal,
      prepared: document.spells.filter(
        (spell) => spell.level > 0 && !spell.alwaysPrepared,
      ).length,
      isKnown: true,
    };
  }

  return { value: null, prepared, isKnown: false };
}
