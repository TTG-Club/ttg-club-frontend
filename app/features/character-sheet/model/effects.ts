import type { ActiveEffect, EffectChange } from '~active-effects/model';

import type { SheetDocument, SheetItem } from './schema';
import type {
  EffectCarrier,
  FormulaContext,
  SheetArmorState,
  SheetDefences,
  SheetRollContext,
  SheetRollMode,
} from './types';

import {
  buildSaveVsConditionFlag,
  EFFECT_CARRIER_ARMOR_CONDITION_PREFIX,
  EFFECT_CONDITION_OPTIONS,
  EFFECT_DAMAGE_TYPE_OPTIONS,
  resolveExhaustionEffects,
  splitConditionParts,
} from '~active-effects/model';

import {
  EFFECT_DEFAULT_PRIORITY,
  EFFECTS_TEXT,
  STEALTH_DISADVANTAGE_FLAG,
} from './constants';
import { evaluateFormula, getContextClassLevel } from './counters';

/*
 * Движок активных эффектов листа — порт `effect-engine.ts` и `effects.ts`
 * листа core-app. Эффекты собираются со всех носителей: свои эффекты и
 * состояния игрока, эффекты умений и черт (выключаемые), надетого и
 * настроенного снаряжения и ступени истощения по таблице PHB 2014.
 *
 * Числовые изменения применяются к значениям листа по режимам VTTG
 * (`add`, `multiply`, `override`, `upgrade`, `downgrade`) в порядке
 * приоритета. Условие изменения лист проверяет только о доспехе носителя
 * (`self.armor === "none"`) — условие о броске («цель ранена») листу
 * проверить нечем, такое изменение пропускается. Флаги («помеха на
 * Скрытность») дают режим броска.
 */

/** Изменение эффекта вместе с носителем — для формулы `@classLevel`. */
export interface CarriedChange {
  change: EffectChange;
  classId: string | null;
  effectName: string;
}

/**
 * Работает ли эффект на самого персонажа: выключенный, нацеленный на другого
 * и аура пропускаются.
 * @param effect - активный эффект
 */
export function isSelfAppliedEffect(effect: ActiveEffect): boolean {
  return !effect.disabled && effect.effectTarget !== 'target' && !effect.aura;
}

/**
 * Работает ли механика предмета: предмет есть и надет, требующий настройки —
 * настроен, а включаемый — включён.
 * @param item - предмет снаряжения
 */
export function isItemMechanicsActive(
  item: Pick<
    SheetItem,
    | 'isEquipped'
    | 'requiresAttunement'
    | 'isAttuned'
    | 'quantity'
    | 'activatable'
    | 'isActive'
  >,
): boolean {
  return (
    item.isEquipped
    && item.quantity > 0
    && (!item.requiresAttunement || item.isAttuned)
    && (!item.activatable || item.isActive)
  );
}

/**
 * Эффект ступени истощения: флаги и изменения всех ступеней до текущей.
 * @param level - ступень истощения
 */
export function createExhaustionEffect(level: number): ActiveEffect | null {
  const summary = resolveExhaustionEffects(level);

  if (!summary.level) {
    return null;
  }

  return {
    id: `exhaustion:${summary.level}`,
    name: `${EFFECTS_TEXT.exhaustion} ${summary.level}`,
    description: summary.descriptions.join(' '),
    disabled: false,
    origin: 'condition',
    transfer: false,
    duration: { type: 'permanent' },
    changes: summary.changes,
    flags: summary.flags,
    conditionKey: 'exhaustion',
  };
}

/**
 * Носители эффектов листа.
 * @param document - лист персонажа
 */
export function collectEffectCarriers(
  document: SheetDocument,
): Array<EffectCarrier> {
  const exhaustion = createExhaustionEffect(document.exhaustion);

  return [
    {
      kind: 'own',
      name: EFFECTS_TEXT.own,
      effects: document.activeEffects,
      classId: null,
    },
    ...document.sources.map((source): EffectCarrier => ({
      kind: 'source',
      name: source.name,
      effects: source.activeEffects.filter(
        (effect) => !source.disabledEffects.includes(effect.id),
      ),
      classId: source.classId,
    })),
    ...document.inventory
      .filter(isItemMechanicsActive)
      .map((item): EffectCarrier => ({
        kind: 'item',
        name: item.name,
        effects: item.activeEffects,
        classId: null,
      })),
    ...(exhaustion
      ? [
          {
            kind: 'exhaustion' as const,
            name: exhaustion.name,
            effects: [exhaustion],
            classId: null,
          },
        ]
      : []),
  ];
}

/**
 * Эффекты, действующие на персонажа, одним списком.
 * @param document - лист персонажа
 */
export function collectAppliedEffects(
  document: SheetDocument,
): Array<ActiveEffect> {
  return collectEffectCarriers(document)
    .flatMap((carrier) => carrier.effects)
    .filter(isSelfAppliedEffect);
}

/** Категория доспеха листа → категория условия эффекта. */
const ARMOR_STATE_CATEGORY = {
  LIGHT: 'light',
  MEDIUM: 'medium',
  HEAVY: 'heavy',
} as const;

/**
 * Состояние доспеха по надетому снаряжению: лучший по КД надетый доспех и
 * наличие щита. Кончившийся предмет в зачёт не идёт.
 * @param document - лист персонажа
 */
export function getSheetArmorState(document: SheetDocument): SheetArmorState {
  let category: SheetArmorState['category'];
  let best = -1;
  let hasShield = false;

  for (const item of document.inventory) {
    if (!item.isEquipped || !item.armor || item.quantity <= 0) {
      continue;
    }

    if (item.armor.category === 'SHIELD') {
      hasShield = true;

      continue;
    }

    const value = item.armor.baseArmorClass + item.armor.bonus;

    if (value > best) {
      best = value;
      category = ARMOR_STATE_CATEGORY[item.armor.category];
    }
  }

  return { category, hasShield };
}

/**
 * Выполнена ли часть условия о доспехе.
 * @param part - часть условия
 * @param armor - состояние доспеха
 */
function matchesArmorConditionPart(
  part: string,
  armor: SheetArmorState,
): boolean {
  if (!part.startsWith(EFFECT_CARRIER_ARMOR_CONDITION_PREFIX)) {
    return false;
  }

  const kind = part
    .slice(EFFECT_CARRIER_ARMOR_CONDITION_PREFIX.length)
    .trim()
    .replace(/^["']|["']$/g, '');

  switch (kind) {
    case 'shield': {
      return armor.hasShield;
    }
    case 'noShield': {
      return !armor.hasShield;
    }
    case 'none': {
      return armor.category === undefined;
    }
    case 'any': {
      return armor.category !== undefined;
    }
    default: {
      return armor.category === kind;
    }
  }
}

/**
 * Выполняется ли условие о доспехе носителя; условие другого семейства —
 * нет.
 * @param condition - условие изменения
 * @param armor - состояние доспеха
 */
export function matchesArmorCondition(
  condition: string,
  armor: SheetArmorState,
): boolean {
  const parts = splitConditionParts(condition);

  return (
    parts.length > 0
    && parts.every((part) => matchesArmorConditionPart(part, armor))
  );
}

/**
 * Изменения эффектов листа для ключа. Изменение с условием берётся, только
 * если условие о доспехе выполнено.
 * @param carriers - носители эффектов
 * @param key - ключ изменения (`armorClass`, `ability.strength`)
 * @param armor - состояние доспеха
 */
export function getCarriedChanges(
  carriers: ReadonlyArray<EffectCarrier>,
  key: string,
  armor: SheetArmorState,
): Array<CarriedChange> {
  return carriers
    .flatMap((carrier) =>
      carrier.effects.filter(isSelfAppliedEffect).flatMap((effect) =>
        effect.changes.map((change) => ({
          change,
          classId: carrier.classId,
          effectName: effect.name,
        })),
      ),
    )
    .filter(
      ({ change }) =>
        change.key === key
        && (!change.condition
          || matchesArmorCondition(change.condition, armor)),
    )
    .sort(
      (left, right) =>
        (left.change.priority ?? EFFECT_DEFAULT_PRIORITY)
        - (right.change.priority ?? EFFECT_DEFAULT_PRIORITY),
    );
}

/** Итог применения изменений: значение и последнее изменившее его. */
export interface AppliedChanges {
  value: number;
  /** Эффект, последним заменивший значение; null — замен не было. */
  replacedBy: string | null;
}

/**
 * Применяет изменения к значению по режимам VTTG в порядке приоритета.
 * Значение-формула считается по значениям листа; непонятное значение
 * (кость, незнакомая переменная) пропускается.
 * @param base - значение до эффектов
 * @param changes - изменения для этого значения
 * @param context - значения листа для формул
 */
export function applyCarriedChanges(
  base: number,
  changes: ReadonlyArray<CarriedChange>,
  context: FormulaContext,
): AppliedChanges {
  let value = base;
  let replacedBy: string | null = null;

  for (const { change, classId, effectName } of changes) {
    const amount = evaluateFormula(
      change.value,
      context,
      getContextClassLevel(context, classId),
    );

    if (amount === null) {
      continue;
    }

    switch (change.mode) {
      case 'add': {
        value += amount;

        break;
      }
      case 'multiply': {
        value = Math.floor(value * amount);

        break;
      }
      case 'override': {
        value = amount;
        replacedBy = effectName;

        break;
      }
      case 'upgrade': {
        if (amount > value) {
          value = amount;
          replacedBy = effectName;
        }

        break;
      }
      case 'downgrade': {
        if (amount < value) {
          value = amount;
          replacedBy = effectName;
        }

        break;
      }
      default: {
        break;
      }
    }
  }

  return { value, replacedBy };
}

/**
 * Значение листа после эффектов для одного ключа.
 * @param carriers - носители эффектов
 * @param key - ключ изменения
 * @param base - значение до эффектов
 * @param armor - состояние доспеха
 * @param context - значения листа для формул
 */
export function getEffectValue(
  carriers: ReadonlyArray<EffectCarrier>,
  key: string,
  base: number,
  armor: SheetArmorState,
  context: FormulaContext,
): number {
  return applyCarriedChanges(
    base,
    getCarriedChanges(carriers, key, armor),
    context,
  ).value;
}

/**
 * Мешает ли надетый доспех прятаться: помеха — полем доспеха, а не эффектом.
 * @param document - лист персонажа
 */
export function hasArmorStealthDisadvantage(document: SheetDocument): boolean {
  return document.inventory.some(
    (item) =>
      item.isEquipped
      && item.quantity > 0
      && item.armor?.stealthDisadvantage === true,
  );
}

/**
 * Безусловные флаги персонажа: из эффектов и помеха шумного доспеха.
 * @param carriers - носители эффектов
 * @param document - лист персонажа
 */
export function getEffectFlags(
  carriers: ReadonlyArray<EffectCarrier>,
  document: SheetDocument,
): ReadonlySet<string> {
  const flags = new Set(
    carriers.flatMap((carrier) =>
      carrier.effects
        .filter(isSelfAppliedEffect)
        .flatMap((effect) => effect.flags),
    ),
  );

  if (hasArmorStealthDisadvantage(document)) {
    flags.add(STEALTH_DISADVANTAGE_FLAG);
  }

  return flags;
}

/**
 * Есть ли флаг преимущества или помехи для броска.
 * @param flags - флаги персонажа
 * @param context - обстоятельства броска
 * @param mode - что ищем
 */
function hasRollFlag(
  flags: ReadonlySet<string>,
  context: SheetRollContext,
  mode: 'advantage' | 'disadvantage',
): boolean {
  const { kind, ability, skill, attackType } = context;

  if (kind === 'attack') {
    return (
      flags.has(`attack.${mode}`)
      || (attackType !== undefined && flags.has(`attack.${attackType}.${mode}`))
    );
  }

  if (kind === 'initiative') {
    return (
      flags.has(`initiative.${mode}`)
      || flags.has(`abilityCheck.${mode}.dexterity`)
      || flags.has(`abilityCheck.${mode}`)
    );
  }

  if (kind === 'savingThrow') {
    return (
      flags.has(`save.${mode}`)
      || (ability !== undefined && flags.has(`save.${mode}.${ability}`))
    );
  }

  return (
    flags.has(`abilityCheck.${mode}`)
    || (ability !== undefined && flags.has(`abilityCheck.${mode}.${ability}`))
    || (skill !== undefined && flags.has(`skill.${skill}.${mode}`))
  );
}

/**
 * Режим броска по флагам: преимущество и помеха гасят друг друга.
 * @param flags - флаги персонажа
 * @param context - обстоятельства броска
 */
export function getSheetRollMode(
  flags: ReadonlySet<string>,
  context: SheetRollContext,
): SheetRollMode {
  const advantage = hasRollFlag(flags, context, 'advantage');

  const disadvantage =
    Boolean(context.isHindered) || hasRollFlag(flags, context, 'disadvantage');

  if (advantage === disadvantage) {
    return 'normal';
  }

  return advantage ? 'advantage' : 'disadvantage';
}

/**
 * Сводит два режима броска: преимущество и помеха гасят друг друга.
 * @param first - режим первого источника
 * @param second - режим второго источника
 */
export function combineRollModes(
  first: SheetRollMode,
  second: SheetRollMode,
): SheetRollMode {
  const advantage = first === 'advantage' || second === 'advantage';
  const disadvantage = first === 'disadvantage' || second === 'disadvantage';

  if (advantage === disadvantage) {
    return 'normal';
  }

  return advantage ? 'advantage' : 'disadvantage';
}

/**
 * Проваливается ли спасбросок автоматически (Парализованный — Сила и
 * Ловкость).
 * @param flags - флаги персонажа
 * @param ability - ключ характеристики в словаре эффектов
 */
export function isSavingThrowAutoFailed(
  flags: ReadonlySet<string>,
  ability: string,
): boolean {
  return flags.has(`save.autoFail.${ability}`);
}

/**
 * Защиты из флагов эффектов (`resistance.fire`) и иммунитеты к состояниям из
 * эффектов — подписями.
 * @param flags - флаги персонажа
 * @param effects - действующие эффекты
 */
export function getEffectDefences(
  flags: ReadonlySet<string>,
  effects: ReadonlyArray<ActiveEffect>,
): SheetDefences {
  const pick = (prefix: string): Array<string> =>
    EFFECT_DAMAGE_TYPE_OPTIONS.filter((damageType) =>
      flags.has(`${prefix}.${damageType.value}`),
    ).map((damageType) => damageType.label);

  const conditionKeys = new Set(
    effects.flatMap((effect) => effect.conditionImmunities ?? []),
  );

  return {
    resistances: pick('resistance'),
    immunities: pick('immunity'),
    vulnerabilities: pick('vulnerability'),
    conditionImmunities: EFFECT_CONDITION_OPTIONS.filter((condition) =>
      conditionKeys.has(condition.value),
    ).map((condition) => condition.label),
  };
}

/**
 * Флаг преимущества спасброска против состояния — для подсказки в листе.
 * @param flags - флаги персонажа
 * @param conditionKey - ключ состояния
 */
export function hasSaveAdvantageAgainst(
  flags: ReadonlySet<string>,
  conditionKey: string,
): boolean {
  return flags.has(buildSaveVsConditionFlag('advantage', conditionKey));
}
