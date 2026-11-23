import type { CustomBonus, SheetDocument } from './schema';
import type { CustomBonusContext } from './skills';
import type { AbilityKey, SpeedKey, SpeedUnit } from './types';

import {
  ABILITY_KEYS,
  ABILITY_SETTINGS_TEXT,
  METERS_PER_FOOT,
  SKILL_BONUS_EFFECTS_LABEL,
  SPEED_UNIT_SHORT_LABELS,
} from './constants';
import { getCustomBonusesTotal } from './skills';
import {
  getAbilityModifier,
  getCharacterLevel,
  getProficiencyBonus,
} from './utils';

/*
 * Настройки показателей листа: свои бонусы к значениям характеристик и
 * настройка спасбросков (подмена характеристики, бонусы отдельного спасброска
 * и общие ко всем).
 */

/**
 * Что нужно знать о персонаже, чтобы посчитать бонус к значению
 * характеристики. Модификаторы — от записанных значений: бонус от
 * модификатора к значению не допускается (`ABILITY_BONUS_KINDS`), иначе пара
 * таких бонусов завела бы подсчёт по кругу. Бонус мастерства — по уровню, до
 * эффектов: формулы эффектов сами считаются от характеристик.
 * @param document - лист персонажа
 */
export function getAbilityBonusContext(
  document: Pick<SheetDocument, 'abilities' | 'classes'>,
): CustomBonusContext {
  const level = getCharacterLevel(document.classes);

  return {
    abilityModifiers: {
      STRENGTH: getAbilityModifier(document.abilities.STRENGTH),
      DEXTERITY: getAbilityModifier(document.abilities.DEXTERITY),
      CONSTITUTION: getAbilityModifier(document.abilities.CONSTITUTION),
      INTELLIGENCE: getAbilityModifier(document.abilities.INTELLIGENCE),
      WISDOM: getAbilityModifier(document.abilities.WISDOM),
      CHARISMA: getAbilityModifier(document.abilities.CHARISMA),
    },
    proficiencyBonus: getProficiencyBonus(level),
    level,
    classes: document.classes,
  };
}

/**
 * Сумма своих бонусов к значению характеристики.
 * @param document - лист персонажа
 * @param ability - характеристика
 */
export function getAbilityBonusesTotal(
  document: Pick<SheetDocument, 'abilities' | 'classes' | 'abilityBonuses'>,
  ability: AbilityKey,
): number {
  return getCustomBonusesTotal(
    document.abilityBonuses[ability] ?? [],
    getAbilityBonusContext(document),
  );
}

/**
 * Характеристика спасброска: подменённая игроком или своя.
 * @param document - лист персонажа
 * @param savingThrow - спасбросок
 */
export function getSavingThrowAbility(
  document: Pick<SheetDocument, 'savingThrowAbilities'>,
  savingThrow: AbilityKey,
): AbilityKey {
  return document.savingThrowAbilities[savingThrow] ?? savingThrow;
}

/** Черновик настройки одного спасброска. */
export interface SavingThrowDraft {
  key: AbilityKey;
  ability: AbilityKey;
  isProficient: boolean;
  bonuses: Array<CustomBonus>;
}

/**
 * Спасбросок без эффектов: модификатор, мастерство, свои и общие бонусы.
 * @param draft - настройка спасброска
 * @param commonBonuses - бонусы ко всем спасброскам
 * @param context - что известно о персонаже
 */
export function getSavingThrowBase(
  draft: Omit<SavingThrowDraft, 'key'>,
  commonBonuses: ReadonlyArray<CustomBonus>,
  context: CustomBonusContext,
): number {
  return (
    context.abilityModifiers[draft.ability]
    + (draft.isProficient ? context.proficiencyBonus : 0)
    + getCustomBonusesTotal(draft.bonuses, context)
    + getCustomBonusesTotal(commonBonuses, context)
  );
}

/**
 * Настройки спасбросков листа черновиками; бонусы копируются, чтобы правки
 * не уходили в лист мимо «Применить».
 * @param document - лист персонажа
 */
export function getSavingThrowDrafts(
  document: Pick<
    SheetDocument,
    'savingThrows' | 'savingThrowAbilities' | 'savingThrowBonuses'
  >,
): Array<SavingThrowDraft> {
  return ABILITY_KEYS.map((key) => ({
    key,
    ability: getSavingThrowAbility(document, key),
    isProficient: document.savingThrows.includes(key),
    bonuses: (document.savingThrowBonuses[key] ?? []).map((bonus) => ({
      ...bonus,
    })),
  }));
}

/**
 * Разбор значения характеристики: «Записано 14 · Пояс +1 · Эффекты +2».
 * Пусто — итог совпадает с записанным и разбирать нечего.
 * @param recorded - записанное значение
 * @param total - итог с бонусами и эффектами
 * @param parts - слагаемые своих бонусов
 * @param formatValue - подпись числа со знаком
 */
export function describeAbilityScore(
  recorded: number,
  total: number,
  parts: ReadonlyArray<{ label: string; value: number }>,
  formatValue: (value: number) => string,
): string {
  if (total === recorded && parts.every((part) => part.value === 0)) {
    return '';
  }

  const rest =
    total - recorded - parts.reduce((sum, part) => sum + part.value, 0);

  return [
    `${ABILITY_SETTINGS_TEXT.breakdownScore} ${recorded}`,
    ...parts
      .filter((part) => part.value !== 0)
      .map((part) => `${part.label} ${formatValue(part.value)}`),
    ...(rest ? [`${SKILL_BONUS_EFFECTS_LABEL} ${formatValue(rest)}`] : []),
  ].join(' · ');
}

/**
 * Сумма своих бонусов скорости, фт. Бонус скорости — только своё число
 * (`SPEED_BONUS_KINDS`).
 * @param document - лист персонажа
 * @param speed - вид передвижения
 */
export function getSpeedBonusesTotal(
  document: Pick<SheetDocument, 'speedBonuses'>,
  speed: SpeedKey,
): number {
  return (document.speedBonuses[speed] ?? []).reduce(
    (sum, bonus) =>
      bonus.kind === 'flat' && Number.isFinite(bonus.value)
        ? sum + bonus.value
        : sum,
    0,
  );
}

/**
 * Расстояние в единицах листа: метры — с одним знаком (1,5; 9).
 * @param feet - расстояние в футах
 * @param unit - единицы листа
 */
export function toSpeedUnit(feet: number, unit: SpeedUnit): number {
  return unit === 'meters'
    ? Math.round(feet * METERS_PER_FOOT * 10) / 10
    : feet;
}

/**
 * Расстояние в футах из единиц листа.
 * @param value - расстояние в единицах листа
 * @param unit - единицы листа
 */
export function fromSpeedUnit(value: number, unit: SpeedUnit): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return unit === 'meters' ? Math.round(value / METERS_PER_FOOT) : value;
}

/**
 * Подпись расстояния в единицах листа: «30 фт.», «9 м».
 * @param feet - расстояние в футах
 * @param unit - единицы листа
 */
export function formatDistance(feet: number, unit: SpeedUnit): string {
  return `${formatDistanceValue(feet, unit)} ${SPEED_UNIT_SHORT_LABELS[unit]}`;
}

/** Число расстояния по-русски: «10,5». */
const distanceFormat = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 1,
});

/**
 * Число расстояния в единицах листа без подписи единиц: «10,5».
 * @param feet - расстояние в футах
 * @param unit - единицы листа
 */
export function formatDistanceValue(feet: number, unit: SpeedUnit): string {
  return distanceFormat.format(toSpeedUnit(feet, unit));
}
