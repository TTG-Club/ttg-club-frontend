import type { CustomBonus, SheetClass, SheetDocument } from './schema';
import type { AbilityKey, SkillKey } from './types';

import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  CUSTOM_BONUS_SOURCE,
  CUSTOM_BONUS_TEXT,
  SKILL_INFO,
} from './constants';

/*
 * Настройка навыков: характеристика навыка (её можно подменить), свои навыки
 * и дополнительные бонусы — своё число или величина, которую лист считает
 * сам (модификатор характеристики, бонус мастерства, уровень персонажа или
 * класса).
 */

/** Что нужно знать о персонаже, чтобы посчитать дополнительный бонус. */
export interface CustomBonusContext {
  abilityModifiers: Readonly<Record<AbilityKey, number>>;
  proficiencyBonus: number;
  level: number;
  classes: ReadonlyArray<Pick<SheetClass, 'id' | 'level'>>;
}

/** Вариант источника бонуса в выпадающем списке. */
export interface CustomBonusSourceOption {
  value: string;
  label: string;
}

/** Группа строк навыков: разделитель с характеристикой и её навыки. */
export interface SkillRowGroup<Row> {
  key: string;
  /** Характеристика группы; null — группировка выключена. */
  ability: AbilityKey | null;
  /** Подпись разделителя; null — разделителя нет. */
  title: string | null;
  rows: Array<Row>;
}

/** Ключ единственной группы, когда группировка выключена. */
const SKILL_GROUP_ALL_KEY = 'all';

/**
 * Характеристика навыка: подменённая игроком или по правилам.
 * @param document - лист персонажа
 * @param skill - навык
 */
export function getSkillAbility(
  document: Pick<SheetDocument, 'skillAbilities'>,
  skill: SkillKey,
): AbilityKey {
  return document.skillAbilities[skill] ?? SKILL_INFO[skill].ability;
}

/**
 * Величина дополнительного бонуса. Уровень пропавшего класса — ноль.
 * @param bonus - бонус
 * @param context - что известно о персонаже
 */
export function getCustomBonusValue(
  bonus: CustomBonus,
  context: CustomBonusContext,
): number {
  switch (bonus.kind) {
    case 'ability':
      return context.abilityModifiers[bonus.ability];
    case 'proficiency':
      return context.proficiencyBonus;
    case 'level':
      return context.level;
    case 'classLevel':
      return (
        context.classes.find((sheetClass) => sheetClass.id === bonus.classId)
          ?.level ?? 0
      );
    default:
      return Number.isFinite(bonus.value) ? bonus.value : 0;
  }
}

/**
 * Сумма дополнительных бонусов.
 * @param bonuses - бонусы
 * @param context - что известно о персонаже
 */
export function getCustomBonusesTotal(
  bonuses: ReadonlyArray<CustomBonus>,
  context: CustomBonusContext,
): number {
  return bonuses.reduce(
    (sum, bonus) => sum + getCustomBonusValue(bonus, context),
    0,
  );
}

/**
 * Источник бонуса для выпадающего списка.
 * @param bonus - бонус
 */
export function getCustomBonusSource(bonus: CustomBonus): string {
  switch (bonus.kind) {
    case 'ability':
      return bonus.ability;
    case 'classLevel':
      return `${CUSTOM_BONUS_SOURCE.classPrefix}${bonus.classId}`;
    case 'level':
      return CUSTOM_BONUS_SOURCE.level;
    case 'proficiency':
      return CUSTOM_BONUS_SOURCE.proficiency;
    default:
      return CUSTOM_BONUS_SOURCE.flat;
  }
}

/**
 * Бонус с новым источником; своё число остаётся, оно ждёт возврата к нему.
 * @param bonus - бонус
 * @param source - выбранный источник
 */
export function withCustomBonusSource(
  bonus: CustomBonus,
  source: string,
): CustomBonus {
  if (source === CUSTOM_BONUS_SOURCE.proficiency) {
    return { ...bonus, kind: 'proficiency' };
  }

  if (source === CUSTOM_BONUS_SOURCE.level) {
    return { ...bonus, kind: 'level' };
  }

  if (source.startsWith(CUSTOM_BONUS_SOURCE.classPrefix)) {
    return {
      ...bonus,
      kind: 'classLevel',
      classId: source.slice(CUSTOM_BONUS_SOURCE.classPrefix.length),
    };
  }

  const ability = ABILITY_KEYS.find((key) => key === source);

  return ability
    ? { ...bonus, kind: 'ability', ability }
    : { ...bonus, kind: 'flat' };
}

/**
 * Источники бонуса: своё число, модификаторы, мастерство, уровень персонажа и
 * уровни классов листа.
 * @param classes - классы листа
 */
export function getCustomBonusSourceOptions(
  classes: ReadonlyArray<Pick<SheetClass, 'id' | 'name'>>,
): Array<CustomBonusSourceOption> {
  return [
    { value: CUSTOM_BONUS_SOURCE.flat, label: CUSTOM_BONUS_TEXT.flat },
    ...ABILITY_KEYS.map((key) => ({
      value: key,
      label: `${CUSTOM_BONUS_TEXT.abilityPrefix} ${ABILITY_LABELS[key].name.toLowerCase()}`,
    })),
    {
      value: CUSTOM_BONUS_SOURCE.proficiency,
      label: CUSTOM_BONUS_TEXT.proficiency,
    },
    { value: CUSTOM_BONUS_SOURCE.level, label: CUSTOM_BONUS_TEXT.level },
    ...classes.map((sheetClass) => ({
      value: `${CUSTOM_BONUS_SOURCE.classPrefix}${sheetClass.id}`,
      label: `${CUSTOM_BONUS_TEXT.classLevel}: ${sheetClass.name}`,
    })),
  ];
}

/**
 * Новый дополнительный бонус: чаще всего это «+1» от предмета.
 * @param id - идентификатор
 */
export function createCustomBonus(id: string): CustomBonus {
  return {
    id,
    kind: 'flat',
    ability: 'STRENGTH',
    classId: '',
    value: 1,
    label: '',
  };
}

/**
 * Строки навыков группами: одной группой без подписи или по характеристикам в
 * порядке листа.
 * @param rows - строки навыков
 * @param isGrouped - группировать по характеристикам
 */
export function getSkillRowGroups<Row extends { ability: AbilityKey }>(
  rows: ReadonlyArray<Row>,
  isGrouped: boolean,
): Array<SkillRowGroup<Row>> {
  if (!isGrouped) {
    return [
      { key: SKILL_GROUP_ALL_KEY, ability: null, title: null, rows: [...rows] },
    ];
  }

  return ABILITY_KEYS.map((ability) => ({
    key: ability,
    ability,
    title: ABILITY_LABELS[ability].name,
    rows: rows.filter((row) => row.ability === ability),
  })).filter((group) => group.rows.length > 0);
}

/**
 * Есть ли уже навык с таким названием (правил или свой), без учёта регистра.
 * @param names - названия навыков
 * @param name - проверяемое название
 */
export function hasSkillName(
  names: ReadonlyArray<string>,
  name: string,
): boolean {
  const normalized = name.trim().toLowerCase();

  return names.some((existing) => existing.toLowerCase() === normalized);
}
