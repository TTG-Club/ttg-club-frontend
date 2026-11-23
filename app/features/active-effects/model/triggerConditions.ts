/**
 * Условия срабатываний эффекта: «только если урон огнём», «кроме излучения и
 * крита», «цель помечена мной», «носитель окровавлен».
 *
 * Условие — та же строка закрытого словаря, что у модификаторов: части через
 * `&&`, каждая — из перечня. Словарь срабатываний шире: у события есть свои
 * данные (урон, бросок, другая сторона), и отрицание пишется явной частью
 * (`damage.type !== "radiant"`), а не приставкой — так словарь остаётся
 * перечнем. Незнакомая часть в VTTG не выполняется: срабатывание с непонятым
 * условием молчит, а не бьёт всегда.
 *
 * Здесь только разбор и сборка строки: выполняет условие сам VTTG.
 *
 * Зеркало: dnd5-test-migrate/src/engine/triggerConditions.ts
 */

import type { EffectTriggerEvent } from './triggerTypes';

import {
  EFFECT_CARRIER_TAG_CONDITION_PREFIX,
  EFFECT_CARRIER_TAG_NOT_CONDITION_PREFIX,
  EFFECT_CARRIER_TYPE_CONDITION_PREFIX,
  EFFECT_CONDITION_AND_SEPARATOR,
  EFFECT_DAMAGE_TYPE_CONDITION_PREFIX,
  EFFECT_DAMAGE_TYPE_NOT_CONDITION_PREFIX,
  EFFECT_TARGET_TYPE_CONDITION_PREFIX,
  EFFECT_TRIGGER_FIXED_CONDITIONS,
  isEffectAbility,
  isEffectCreatureCategory,
  isEffectCreatureSize,
  isEffectDamageType,
  splitConditionParts,
} from './constants';
import {
  ATTACK_DATA_TRIGGER_EVENTS,
  COMBAT_ROUND_TRIGGER_EVENTS,
  DAMAGE_DATA_TRIGGER_EVENTS,
  isEffectTag,
  MOVEMENT_TRIGGER_EVENTS,
  OTHER_PARTY_TRIGGER_EVENTS,
  OWN_DEED_TRIGGER_EVENTS,
} from './triggerTypes';

/** Чем бьют: вид атаки, от которого зависят части условия. */
export const TRIGGER_ATTACK_KINDS = [
  'melee',
  'ranged',
  'weapon',
  'spell',
  'unarmed',
] as const;

/** Вид атаки события. */
export type TriggerAttackKind = (typeof TRIGGER_ATTACK_KINDS)[number];

/** Виды атаки строками — для сверки со значением части условия. */
const ATTACK_KIND_VALUES: ReadonlySet<string> = new Set(TRIGGER_ATTACK_KINDS);

/**
 * Вид ли атаки эта строка.
 *
 * @param attackKind строка из условия.
 * @returns `true`, если это известный вид атаки.
 */
export function isTriggerAttackKind(
  attackKind: string,
): attackKind is TriggerAttackKind {
  return ATTACK_KIND_VALUES.has(attackKind);
}

/** Виды частей условия срабатывания. */
export const TRIGGER_CONDITION_KINDS = [
  'damageType',
  'damageTypeNot',
  'damageCritical',
  'damageNotCritical',
  'selfBloodied',
  'selfWounded',
  'selfCreatureType',
  'selfTag',
  'selfTagNot',
  'rollAdvantage',
  'rollDisadvantage',
  'otherCreatureType',
  'otherMarkedBySelf',
  'selfHpAtMost',
  'selfHpAtLeast',
  'selfSizeAtMost',
  'selfSizeAtLeast',
  'selfCondition',
  'selfConditionNot',
  'selfTagCountAtLeast',
  'selfTagFromSource',
  'selfTagFromSourceNot',
  'selfTempHpZero',
  'selfGrounded',
  'selfSpecies',
  'selfAbilityAtMost',
  'selfAbilityAtLeast',
  'otherIsSource',
  'otherBloodied',
  'otherHpAtMost',
  'damageAtLeast',
  'sourceWithin',
  'attackKind',
  'attackAbility',
  'attackLanded',
  'attackMissed',
  'combatRoundIs',
  'combatRoundAtLeast',
  'movementOwn',
  'movementForced',
] as const;

/**
 * Вид части условия:
 * - `damageType` / `damageTypeNot` — урон этого типа / без этого типа;
 * - `damageCritical` / `damageNotCritical` — крит / не крит;
 * - `selfBloodied` / `selfWounded` — у носителя не больше половины хитов / хиты не полные;
 * - `selfCreatureType` — тип носителя;
 * - `selfTag` / `selfTagNot` — на носителе есть / нет отметки;
 * - `rollAdvantage` / `rollDisadvantage` — атака с преимуществом / помехой;
 * - `otherCreatureType` — тип другой стороны;
 * - `otherMarkedBySelf` — другая сторона помечена носителем;
 * - `selfHpAtMost` / `selfHpAtLeast` — хитов у носителя не больше / не меньше N;
 * - `selfSizeAtMost` / `selfSizeAtLeast` — размер носителя не больше / не меньше;
 * - `selfCondition` / `selfConditionNot` — на носителе есть / нет состояния;
 * - `selfTagCountAtLeast` — отметок с ключом на носителе не меньше N (счётчик);
 * - `selfTagFromSource` / `selfTagFromSourceNot` — есть / нет отметки,
 *   поставленной тем же, кто наложил эффект;
 * - `selfTempHpZero` — у носителя нет временных хитов;
 * - `selfGrounded` — носитель стоит на земле (не летит);
 * - `selfSpecies` — раса носителя по названию записи (ключ VTTG `self.species`);
 * - `selfAbilityAtMost` / `selfAbilityAtLeast` — характеристика носителя не
 *   больше / не меньше N;
 * - `otherIsSource` — другая сторона и есть тот, кто наложил эффект;
 * - `otherBloodied` — у другой стороны не больше половины хитов;
 * - `otherHpAtMost` — у другой стороны не больше N хитов;
 * - `damageAtLeast` — урон события не меньше N;
 * - `sourceWithin` — наложивший эффект в пределах N футов;
 * - `attackKind` — вид атаки события;
 * - `attackAbility` — атака считается этой характеристикой;
 * - `attackLanded` / `attackMissed` — атака попала / промахнулась;
 * - `combatRoundIs` / `combatRoundAtLeast` — идёт раунд боя N / раунд не
 *   раньше N (расписание «на втором раунде», «с третьего раунда»);
 * - `movementOwn` / `movementForced` — носитель шёл сам / его переставили
 *   правила (толчок, притягивание, телепортация).
 */
export type TriggerConditionKind = (typeof TRIGGER_CONDITION_KINDS)[number];

/** Какое значение выбирается у части условия. */
export type TriggerConditionParameter =
  | 'damageType'
  | 'creatureType'
  | 'tag'
  | 'number'
  | 'size'
  | 'condition'
  | 'ability'
  | 'attackKind'
  | 'text';

/** Часть условия срабатывания: вид и значение, если оно есть. */
export interface TriggerConditionPart {
  kind: TriggerConditionKind;
  value?: string;
  /** Порог счётчика отметок или характеристики. */
  amount?: number;
}

/**
 * События, где известна другая сторона: противник в атаке, источник урона и
 * тот, кого носитель свалил, — условия о ней читают другую сторону события.
 */
const OTHER_CONDITION_EVENTS: readonly EffectTriggerEvent[] = [
  ...OTHER_PARTY_TRIGGER_EVENTS,
  ...OWN_DEED_TRIGGER_EVENTS,
];

/**
 * На каких событиях часть условия что-то значит; `undefined` — на любых. На
 * чужом событии часть не выполняется: данных для неё нет.
 */
const KIND_EVENTS: Record<
  TriggerConditionKind,
  readonly EffectTriggerEvent[] | undefined
> = {
  damageType: DAMAGE_DATA_TRIGGER_EVENTS,
  damageTypeNot: DAMAGE_DATA_TRIGGER_EVENTS,
  damageCritical: DAMAGE_DATA_TRIGGER_EVENTS,
  damageNotCritical: DAMAGE_DATA_TRIGGER_EVENTS,
  selfBloodied: undefined,
  selfWounded: undefined,
  selfCreatureType: undefined,
  selfTag: undefined,
  selfTagNot: undefined,
  rollAdvantage: ['attackRoll'],
  rollDisadvantage: ['attackRoll'],
  otherCreatureType: OTHER_CONDITION_EVENTS,
  otherMarkedBySelf: ['attackRoll'],
  selfHpAtMost: undefined,
  selfHpAtLeast: undefined,
  selfSizeAtMost: undefined,
  selfSizeAtLeast: undefined,
  selfCondition: undefined,
  selfConditionNot: undefined,
  selfTagCountAtLeast: undefined,
  selfTagFromSource: undefined,
  selfTagFromSourceNot: undefined,
  selfTempHpZero: undefined,
  selfGrounded: undefined,
  selfSpecies: undefined,
  selfAbilityAtMost: undefined,
  selfAbilityAtLeast: undefined,
  otherIsSource: OTHER_CONDITION_EVENTS,
  otherBloodied: OTHER_CONDITION_EVENTS,
  otherHpAtMost: OTHER_CONDITION_EVENTS,
  damageAtLeast: DAMAGE_DATA_TRIGGER_EVENTS,
  sourceWithin: undefined,
  attackKind: ATTACK_DATA_TRIGGER_EVENTS,
  attackAbility: ATTACK_DATA_TRIGGER_EVENTS,
  attackLanded: ATTACK_DATA_TRIGGER_EVENTS,
  attackMissed: ATTACK_DATA_TRIGGER_EVENTS,
  combatRoundIs: COMBAT_ROUND_TRIGGER_EVENTS,
  combatRoundAtLeast: COMBAT_ROUND_TRIGGER_EVENTS,
  movementOwn: MOVEMENT_TRIGGER_EVENTS,
  movementForced: MOVEMENT_TRIGGER_EVENTS,
};

/** Части условия со значением: приставка строки и что выбирается. */
const PARAMETRIC_PARTS: Partial<
  Record<
    TriggerConditionKind,
    { prefix: string; parameter: TriggerConditionParameter }
  >
> = {
  damageType: {
    prefix: EFFECT_DAMAGE_TYPE_CONDITION_PREFIX,
    parameter: 'damageType',
  },
  damageTypeNot: {
    prefix: EFFECT_DAMAGE_TYPE_NOT_CONDITION_PREFIX,
    parameter: 'damageType',
  },
  selfCreatureType: {
    prefix: EFFECT_CARRIER_TYPE_CONDITION_PREFIX,
    parameter: 'creatureType',
  },
  otherCreatureType: {
    prefix: EFFECT_TARGET_TYPE_CONDITION_PREFIX,
    parameter: 'creatureType',
  },
  selfTag: { prefix: EFFECT_CARRIER_TAG_CONDITION_PREFIX, parameter: 'tag' },
  selfTagNot: {
    prefix: EFFECT_CARRIER_TAG_NOT_CONDITION_PREFIX,
    parameter: 'tag',
  },
  selfHpAtMost: { prefix: 'self.hp.value <= ', parameter: 'number' },
  selfHpAtLeast: { prefix: 'self.hp.value >= ', parameter: 'number' },
  selfSizeAtMost: { prefix: 'self.size <= ', parameter: 'size' },
  selfSizeAtLeast: { prefix: 'self.size >= ', parameter: 'size' },
  selfCondition: { prefix: 'self.condition === ', parameter: 'condition' },
  selfConditionNot: { prefix: 'self.condition !== ', parameter: 'condition' },
  selfTagCountAtLeast: { prefix: 'self.tagCount[', parameter: 'tag' },
  selfTagFromSource: { prefix: 'self.tagFromSource === ', parameter: 'tag' },
  selfTagFromSourceNot: {
    prefix: 'self.tagFromSource !== ',
    parameter: 'tag',
  },
  selfSpecies: { prefix: 'self.species === ', parameter: 'text' },
  otherHpAtMost: { prefix: 'target.hp.value <= ', parameter: 'number' },
  damageAtLeast: { prefix: 'damage.amount >= ', parameter: 'number' },
  sourceWithin: { prefix: 'source.distance <= ', parameter: 'number' },
  attackKind: { prefix: 'attack.kind === ', parameter: 'attackKind' },
  attackAbility: { prefix: 'attack.ability === ', parameter: 'ability' },
  selfAbilityAtMost: { prefix: 'self.ability[', parameter: 'ability' },
  selfAbilityAtLeast: { prefix: 'self.ability[', parameter: 'ability' },
  combatRoundIs: { prefix: 'combat.round === ', parameter: 'number' },
  combatRoundAtLeast: { prefix: 'combat.round >= ', parameter: 'number' },
};

/**
 * Счётчик отметок строкой: `self.tagCount["провал"] >= 3`. Ключ в квадратных
 * скобках — в ключе отметки бывает точка, и через точку его не прочитать.
 */
const TAG_COUNT_PATTERN = /^self\.tagCount\["([^"]+)"\] >= (\d+)$/u;

/**
 * Характеристика носителя строкой: `self.ability["strength"] >= 13`. Как у
 * счётчика отметок, у части два значения — какая характеристика и порог.
 */
const ABILITY_PATTERN = /^self\.ability\["(\w+)"\] (<=|>=) (\d+)$/u;

/** Части условия с порогом: у них два значения, а не одно. */
const PARTS_WITH_AMOUNT: readonly TriggerConditionKind[] = [
  'selfTagCountAtLeast',
  'selfAbilityAtMost',
  'selfAbilityAtLeast',
];

/** Порог характеристики, пока автор не задал свой. */
export const DEFAULT_ABILITY_THRESHOLD = 10;

/** Порог счётчика отметок, пока автор не задал свой. */
export const DEFAULT_TAG_COUNT_THRESHOLD = 3;

/** Наименьший порог счётчика отметок. */
export const MIN_TAG_COUNT_THRESHOLD = 1;

/** Самый большой порог числа в условии: хиты и счётчики. */
const MAX_CONDITION_NUMBER = 100_000;

/** Самая длинная свободная строка в условии: название вида. */
const MAX_CONDITION_TEXT = 100;

/** Наименьшее число в условии: отрицательных хитов не бывает. */
export const MIN_CONDITION_NUMBER = 0;

/** Целое неотрицательное число строкой. */
const WHOLE_NUMBER_PATTERN = /^\d+$/;

/**
 * Есть ли у части условия второе число — порог (счётчик отметок,
 * характеристика).
 *
 * @param kind вид части.
 * @returns `true` для части с порогом.
 */
export function triggerConditionHasAmount(kind: TriggerConditionKind): boolean {
  return PARTS_WITH_AMOUNT.includes(kind);
}

/**
 * Порог счётчика из ввода: целое не меньше наименьшего.
 *
 * @param value введённое число; пусто — наименьший порог.
 * @returns порог.
 */
export function normalizeTagCountThreshold(
  value: number | null | undefined,
): number {
  return Math.max(
    MIN_TAG_COUNT_THRESHOLD,
    Math.trunc(value ?? MIN_TAG_COUNT_THRESHOLD),
  );
}

/**
 * Годится ли строка числом условия.
 *
 * @param value строка значения.
 * @returns `true` для целого от нуля до предела.
 */
function isConditionNumber(value: string): boolean {
  return (
    WHOLE_NUMBER_PATTERN.test(value) && Number(value) <= MAX_CONDITION_NUMBER
  );
}

/** Кавычки вокруг значения в строке условия. */
const QUOTES_PATTERN = /^["']|["']$/g;

/**
 * Годится ли значение для части условия.
 *
 * @param parameter что выбирается.
 * @param value значение.
 * @returns `true`, если значение из словаря.
 */
function isParameterValue(
  parameter: TriggerConditionParameter,
  value: string,
): boolean {
  switch (parameter) {
    case 'damageType':
      return isEffectDamageType(value);
    case 'creatureType':
      return isEffectCreatureCategory(value);
    case 'number':
      return isConditionNumber(value);
    case 'size':
      return isEffectCreatureSize(value);
    case 'ability':
      return isEffectAbility(value);
    case 'attackKind':
      return isTriggerAttackKind(value);
    case 'text':
      return value.trim().length > 0 && value.length <= MAX_CONDITION_TEXT;
    default:
      // Ключ состояния мира и ключ отметки — одного вида: буквы, цифры, «_.-»
      return isEffectTag(value);
  }
}

/**
 * Что выбирается у вида условия.
 *
 * @param kind вид части.
 * @returns параметр либо `undefined`, если значения нет.
 */
export function getTriggerConditionParameter(
  kind: TriggerConditionKind,
): TriggerConditionParameter | undefined {
  return PARAMETRIC_PARTS[kind]?.parameter;
}

/**
 * Строка части условия.
 *
 * @param part вид и значение.
 * @returns строка словаря.
 */
function buildTriggerConditionPart(part: TriggerConditionPart): string {
  if (part.kind === 'selfTagCountAtLeast') {
    return `self.tagCount["${part.value ?? ''}"] >= ${part.amount ?? DEFAULT_TAG_COUNT_THRESHOLD}`;
  }

  if (part.kind === 'selfAbilityAtMost' || part.kind === 'selfAbilityAtLeast') {
    const sign = part.kind === 'selfAbilityAtMost' ? '<=' : '>=';

    return `self.ability["${part.value ?? ''}"] ${sign} ${part.amount ?? DEFAULT_ABILITY_THRESHOLD}`;
  }

  const parametric = PARAMETRIC_PARTS[part.kind];

  if (!parametric) {
    return EFFECT_TRIGGER_FIXED_CONDITIONS[part.kind] ?? '';
  }

  // Число пишется без кавычек: `self.hp.value <= 50`
  return parametric.parameter === 'number'
    ? `${parametric.prefix}${part.value ?? '0'}`
    : `${parametric.prefix}"${part.value ?? ''}"`;
}

/**
 * Вид и значение части условия по строке.
 *
 * @param text часть условия.
 * @returns часть либо `null`, если строка не из словаря срабатываний.
 */
export function parseTriggerConditionPart(
  text: string,
): TriggerConditionPart | null {
  const trimmed = text.trim();
  const abilityMatch = ABILITY_PATTERN.exec(trimmed);

  if (abilityMatch) {
    const [, ability = '', sign = '', threshold = ''] = abilityMatch;

    return isEffectAbility(ability) && isConditionNumber(threshold)
      ? {
          kind: sign === '<=' ? 'selfAbilityAtMost' : 'selfAbilityAtLeast',
          value: ability,
          amount: Number(threshold),
        }
      : null;
  }

  const tagCount = TAG_COUNT_PATTERN.exec(trimmed);

  if (tagCount) {
    const [, tag = '', threshold = ''] = tagCount;

    return isEffectTag(tag) && isConditionNumber(threshold)
      ? { kind: 'selfTagCountAtLeast', value: tag, amount: Number(threshold) }
      : null;
  }

  for (const kind of TRIGGER_CONDITION_KINDS) {
    if (EFFECT_TRIGGER_FIXED_CONDITIONS[kind] === trimmed) {
      return { kind };
    }

    const parametric = PARAMETRIC_PARTS[kind];

    if (parametric && trimmed.startsWith(parametric.prefix)) {
      const value = trimmed
        .slice(parametric.prefix.length)
        .trim()
        .replace(QUOTES_PATTERN, '');

      return isParameterValue(parametric.parameter, value)
        ? { kind, value }
        : null;
    }
  }

  return null;
}

/**
 * Части условия срабатывания: разобранные и строки, которых словарь не знает
 * (их форма показывает как есть, чтобы не терять).
 *
 * @param condition условие срабатывания.
 * @returns части по порядку.
 */
export function readTriggerConditionParts(
  condition: string | undefined,
): Array<TriggerConditionPart | string> {
  return splitConditionParts(condition ?? '').map(
    (text) => parseTriggerConditionPart(text) ?? text,
  );
}

/**
 * Условие срабатывания из частей.
 *
 * @param parts части: разобранные и строки как есть.
 * @returns условие либо `undefined`, если частей нет.
 */
export function writeTriggerCondition(
  parts: ReadonlyArray<TriggerConditionPart | string>,
): string | undefined {
  const texts = parts
    .map((part) =>
      typeof part === 'string' ? part : buildTriggerConditionPart(part),
    )
    .filter((text) => text.length > 0);

  return texts.length > 0
    ? texts.join(` ${EFFECT_CONDITION_AND_SEPARATOR} `)
    : undefined;
}

/**
 * Виды условий, которые что-то значат на событии.
 *
 * @param event событие срабатывания.
 * @returns виды по порядку показа.
 */
export function listTriggerConditionKinds(
  event: EffectTriggerEvent,
): TriggerConditionKind[] {
  return TRIGGER_CONDITION_KINDS.filter((kind) => {
    const events = KIND_EVENTS[kind];

    return events === undefined || events.includes(event);
  });
}
