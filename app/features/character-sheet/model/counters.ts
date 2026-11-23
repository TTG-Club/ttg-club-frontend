import type { MechanicsCounter } from './mechanics';
import type {
  ResourceReset,
  SheetDocument,
  SheetItem,
  SheetResource,
  SheetSource,
} from './schema';
import type { AbilityKey, FormulaContext } from './types';

import { clamp } from 'es-toolkit';

import {
  ABILITY_ABBREVIATIONS,
  COUNTER_REST_MODES,
  FORMULA_TOKENS,
  RECHARGE_ALL,
  RECHARGE_EVENTS,
  RESOURCE_RESET_BY_RECOVERY,
  SHORT_REST_ONE_AMOUNT,
} from './constants';
import { getLongRestHitDiceRecovery } from './health';
import {
  createSheetElementId,
  getAbilityModifier,
  getCharacterLevel,
  getHitDiceTotals,
  getProficiencyBonus,
} from './utils';

/*
 * Ресурсы со счётчиком (`mechanics.counters`): максимум формулой или
 * ступенями, восстановление на отдыхе. Формула та же, что у значений
 * активных эффектов: сумма слагаемых, каждое — число или переменная листа
 * (`@prof`, `@level`, `@classLevel`, `@mod.<сокращение>`) с множителем.
 */

/** Сокращения характеристик формулы по ключу. */
const ABILITY_BY_ABBREVIATION: ReadonlyMap<string, AbilityKey> = new Map(
  Object.entries(ABILITY_ABBREVIATIONS),
);

/**
 * Значения листа для формул.
 * @param document - лист персонажа
 * @param abilities - характеристики, от которых считаются модификаторы
 */
export function createFormulaContext(
  document: SheetDocument,
  abilities: SheetDocument['abilities'] = document.abilities,
): FormulaContext {
  const level = getCharacterLevel(document.classes);

  return {
    proficiencyBonus: getProficiencyBonus(level),
    level,
    abilityModifiers: {
      STRENGTH: getAbilityModifier(abilities.STRENGTH),
      DEXTERITY: getAbilityModifier(abilities.DEXTERITY),
      CONSTITUTION: getAbilityModifier(abilities.CONSTITUTION),
      INTELLIGENCE: getAbilityModifier(abilities.INTELLIGENCE),
      WISDOM: getAbilityModifier(abilities.WISDOM),
      CHARISMA: getAbilityModifier(abilities.CHARISMA),
    },
    classLevels: Object.fromEntries(
      document.classes.map((sheetClass) => [sheetClass.id, sheetClass.level]),
    ),
  };
}

/**
 * Значение переменной или числа формулы; незнакомое — null.
 * @param token - слагаемое в нижнем регистре
 * @param context - значения листа
 * @param classLevel - уровень класса, выдавшего формулу
 */
function evaluateFormulaToken(
  token: string,
  context: FormulaContext,
  classLevel: number,
): number | null {
  if (/^\d+(?:\.\d+)?$/.test(token)) {
    return Number(token);
  }

  if (token === FORMULA_TOKENS.proficiency) {
    return context.proficiencyBonus;
  }

  if (token === FORMULA_TOKENS.level) {
    return context.level;
  }

  if (token === FORMULA_TOKENS.classLevel) {
    return classLevel;
  }

  if (token.startsWith(FORMULA_TOKENS.abilityPrefix)) {
    const ability = ABILITY_BY_ABBREVIATION.get(
      token.slice(FORMULA_TOKENS.abilityPrefix.length),
    );

    return ability ? context.abilityModifiers[ability] : null;
  }

  return null;
}

/**
 * Значение формулы числом. Незнакомая переменная или кость делает формулу
 * непонятной целиком: лучше не применить, чем применить с нулём.
 * @param formula - формула, например `10+@mod.dex+@mod.con`
 * @param context - значения листа
 * @param classLevel - уровень класса, выдавшего формулу; нет — общий уровень
 */
export function evaluateFormula(
  formula: string,
  context: FormulaContext,
  classLevel: number = context.level,
): number | null {
  const compact = formula.toLowerCase().replaceAll(/\s+/g, '');
  const terms = compact.match(/[+-]?[^+-]+/g);

  if (!compact || !terms) {
    return null;
  }

  let total = 0;

  for (const term of terms) {
    const sign = term.startsWith('-') ? -1 : 1;

    let product = 1;

    for (const factor of term.replace(/^[+-]/, '').split('*')) {
      const value = evaluateFormulaToken(factor, context, classLevel);

      if (value === null) {
        return null;
      }

      product *= value;
    }

    total += sign * product;
  }

  return total;
}

/**
 * Уровень класса, которому принадлежит ресурс; у ресурса без класса — общий.
 * @param context - значения листа
 * @param classId - класс листа
 */
export function getContextClassLevel(
  context: FormulaContext,
  classId: string | null,
): number {
  return (classId ? context.classLevels[classId] : undefined) ?? context.level;
}

/**
 * Максимум ресурса: ступень по уровню важнее формулы, формула важнее числа.
 * Нижняя граница подпирает формулу снизу.
 * @param resource - ресурс листа
 * @param context - значения листа
 */
export function getResourceMax(
  resource: SheetResource,
  context: FormulaContext,
): number {
  const classLevel = getContextClassLevel(context, resource.classId);

  const step = resource.scaling
    .filter((scaling) => scaling.level <= classLevel)
    .sort((left, right) => right.level - left.level)[0];

  if (step) {
    return Math.max(0, step.max);
  }

  if (resource.formula) {
    const value = evaluateFormula(resource.formula, context, classLevel);

    if (value !== null) {
      return Math.max(resource.minimum, Math.floor(value), 0);
    }
  }

  return resource.max;
}

/**
 * Правило отдыха ресурса из счётчика: новые правила `shortRest`/`longRest`
 * важнее прежнего `recovery`.
 * @param counter - счётчик из механики
 */
export function getCounterReset(counter: MechanicsCounter): ResourceReset {
  const shortMode = counter.shortRest?.mode;

  if (shortMode === COUNTER_REST_MODES.all) {
    return 'SHORT';
  }

  if (shortMode === COUNTER_REST_MODES.amount) {
    return 'SHORT_ONE';
  }

  if (shortMode === COUNTER_REST_MODES.none || counter.longRest) {
    return 'LONG';
  }

  return (
    Object.entries(RESOURCE_RESET_BY_RECOVERY).find(
      ([recovery]) => recovery === counter.recovery,
    )?.[1] ?? 'LONG'
  );
}

/**
 * Ресурсы источника по его счётчикам: уже заведённые обновляют формулу и
 * название, не трогая потраченное; новые появляются полными (или пустыми,
 * если счётчик так велит); исчезнувшие из механики — уходят.
 * @param document - лист персонажа
 * @param source - источник механики
 */
export function syncSourceResources(
  document: SheetDocument,
  source: SheetSource,
): SheetDocument {
  const counters = (source.mechanics?.counters ?? []).filter(
    (counter) => counter.key,
  );

  const keys = new Set(counters.map((counter) => counter.key));
  const context = createFormulaContext(document);

  const kept = document.resources.filter(
    (resource) =>
      resource.sourceId !== source.id
      || (resource.counterKey !== null && keys.has(resource.counterKey)),
  );

  const updated = kept.map((resource) => {
    const counter =
      resource.sourceId === source.id
        ? counters.find((candidate) => candidate.key === resource.counterKey)
        : undefined;

    return counter
      ? {
          ...resource,
          name: counter.name || resource.name,
          formula: counter.max ?? null,
          scaling: counter.scaling ?? [],
          minimum: counter.min ?? 0,
          reset: getCounterReset(counter),
        }
      : resource;
  });

  const added = counters
    .filter(
      (counter) =>
        !kept.some(
          (resource) =>
            resource.sourceId === source.id
            && resource.counterKey === counter.key,
        ),
    )
    .map((counter): SheetResource => {
      const draft: SheetResource = {
        id: createSheetElementId(),
        name: counter.name || counter.key,
        max: 0,
        used: 0,
        reset: getCounterReset(counter),
        sourceId: source.id,
        counterKey: counter.key,
        formula: counter.max ?? null,
        scaling: counter.scaling ?? [],
        minimum: counter.min ?? 0,
        classId: source.classId,
      };

      const max = getResourceMax(draft, context);

      return { ...draft, max, used: counter.startsEmpty ? max : 0 };
    });

  return { ...document, resources: [...updated, ...added] };
}

/**
 * Потрачено после отдыха по правилу ресурса.
 * @param resource - ресурс листа
 * @param isLongRest - долгий отдых
 */
function getRestedUsage(resource: SheetResource, isLongRest: boolean): number {
  if (isLongRest || resource.reset === 'SHORT') {
    return 0;
  }

  if (resource.reset === 'SHORT_ONE') {
    return Math.max(0, resource.used - SHORT_REST_ONE_AMOUNT);
  }

  return resource.used;
}

/**
 * Заряды предмета после события восстановления. Формула «все» или пустая
 * возвращает все заряды, остальные — через бросок.
 * @param item - предмет
 * @param events - наступившие события восстановления
 * @param rollRecharge - бросок формулы восстановления
 */
function rechargeItem(
  item: SheetItem,
  events: ReadonlyArray<string>,
  rollRecharge: (formula: string) => number,
): SheetItem {
  const { charges } = item;

  if (!charges || !charges.used || !events.includes(charges.rechargeEvent)) {
    return item;
  }

  const formula = charges.recharge.trim().toLowerCase();

  const restored =
    !formula || formula === RECHARGE_ALL
      ? charges.used
      : Math.max(0, rollRecharge(formula));

  return {
    ...item,
    charges: {
      ...charges,
      used: clamp(charges.used - restored, 0, charges.max),
    },
  };
}

/**
 * Короткий отдых: ресурсы короткого отдыха, «один заряд», ячейки договора и
 * заряды предметов, восстанавливающиеся после короткого отдыха.
 * @param document - лист персонажа
 * @param rollRecharge - бросок формулы восстановления зарядов
 */
export function applyMechanicsShortRest(
  document: SheetDocument,
  rollRecharge: (formula: string) => number,
): SheetDocument {
  return {
    ...document,
    pactSlotsUsed: 0,
    resources: document.resources.map((resource) => ({
      ...resource,
      used: getRestedUsage(resource, false),
    })),
    inventory: document.inventory.map((item) =>
      rechargeItem(item, [RECHARGE_EVENTS.short], rollRecharge),
    ),
  };
}

/**
 * Долгий отдых по правилам 2014: все хиты, кости хитов (половина от общего
 * числа, не меньше одной), все ячейки и ресурсы, заряды предметов (долгий отдых и рассвет),
 * истощение уменьшается на ступень.
 * @param document - лист персонажа
 * @param hitPointsMax - максимум хитов с учётом механики
 * @param rollRecharge - бросок формулы восстановления зарядов
 */
export function applyMechanicsLongRest(
  document: SheetDocument,
  hitPointsMax: number,
  rollRecharge: (formula: string) => number,
): SheetDocument {
  const totals = getHitDiceTotals(document);
  const recovery = getLongRestHitDiceRecovery(totals);
  const hitDiceUsed: Record<string, number> = {};

  for (const total of totals) {
    hitDiceUsed[String(total.die)] = total.used - (recovery[total.die] ?? 0);
  }

  return {
    ...document,
    health: { ...document.health, current: hitPointsMax, temporary: 0 },
    hitDiceUsed,
    deathSaves: { successes: 0, failures: 0 },
    spellSlotsUsed: document.spellSlotsUsed.map(() => 0),
    pactSlotsUsed: 0,
    exhaustion: Math.max(0, document.exhaustion - 1),
    resources: document.resources.map((resource) => ({ ...resource, used: 0 })),
    inventory: document.inventory.map((item) =>
      rechargeItem(
        item,
        [RECHARGE_EVENTS.short, RECHARGE_EVENTS.long, RECHARGE_EVENTS.dawn],
        rollRecharge,
      ),
    ),
  };
}

/**
 * Рассвет: заряды предметов, восстанавливающиеся на рассвете.
 * @param document - лист персонажа
 * @param rollRecharge - бросок формулы восстановления зарядов
 */
export function applyDawn(
  document: SheetDocument,
  rollRecharge: (formula: string) => number,
): SheetDocument {
  return {
    ...document,
    inventory: document.inventory.map((item) =>
      rechargeItem(item, [RECHARGE_EVENTS.dawn], rollRecharge),
    ),
  };
}
