/**
 * Терпимая загрузка активных эффектов с сервера.
 *
 * Внешние данные — `unknown`, форма проверяется Zod (AGENTS.md), но строгий
 * разбор здесь опасен: открыл и сохранил — и всё, чего схема не знает,
 * пропало бы из записи. Поэтому разбор, как у системы, отбрасывает как можно
 * меньше:
 * - эффект выпадает, только если нет `id`/`name` или `changes`, `flags`,
 *   `duration` не той формы;
 * - строки модификаторов и срабатывания разбираются по одной: негодная выпадает
 *   одна;
 * - незнакомое значение необязательного поля обнуляет поле, а не эффект;
 * - числа, набранные строкой, приводятся к числам;
 * - флаги не сверяются со словарём сайта: он отстаёт от системы, и сверка
 *   стирала бы флаги, которые VTTG понимает.
 *
 * Зеркало схем dnd5-test-migrate/src/engine/activeEffectTypes.ts.
 */

import type { EffectTrigger, NestedEffectTrigger } from './triggerTypes';
import type {
  ActiveEffect,
  EffectActivation,
  EffectAura,
  EffectChange,
  EffectCharges,
  EffectDamagePart,
  EffectDuration,
  EffectEscape,
  EffectRecurringDamage,
  EffectRecurringSave,
  EffectSave,
  EffectStage,
  EffectVariant,
} from './types';

import { z } from 'zod';

import {
  EFFECT_CHANGE_STEP_PERIODS,
  MAX_EFFECT_CHANGE_STEP,
} from './changeSteps';
import { EFFECT_CONDITION_OPTIONS, EFFECT_SKILL_OPTIONS } from './constants';
import { isHealingDamagePart } from './describe';
import {
  EFFECT_ACTION_COSTS,
  EFFECT_CAST_OWNERS,
  EFFECT_NOTIFY_TARGETS,
  EFFECT_RESTORE_KINDS,
  EFFECT_TAG_PATTERN,
  EFFECT_TEMP_HP_MODES,
  EFFECT_TRIGGER_ACTION_GATES,
  EFFECT_TRIGGER_AREA_SHIFT_KINDS,
  EFFECT_TRIGGER_AREA_TARGETS,
  EFFECT_TRIGGER_ATTACK_ROLES,
  EFFECT_TRIGGER_CHOOSERS,
  EFFECT_TRIGGER_EVENTS,
  EFFECT_TRIGGER_LIMIT_PERIODS,
  EFFECT_TRIGGER_MAX_HP_REST_ENDS,
  EFFECT_TRIGGER_MOVE_KINDS,
  EFFECT_TRIGGER_MOVE_ORIGINS,
  EFFECT_TRIGGER_RECIPIENTS,
  EFFECT_TRIGGER_RESERVED_EVENTS,
  EFFECT_TRIGGER_REST_TYPES,
  EFFECT_TRIGGER_SAVE_MODES,
  EFFECT_TRIGGER_TURN_OWNERS,
  MAX_EFFECT_MOVE_COST_FEET,
  MAX_NOTIFY_TEXT_LENGTH,
  MAX_SAVE_MODE_RULES,
  MAX_SPELL_SLOT_LEVEL,
  MAX_TRIGGER_CHANCE_PERCENT,
  MAX_TRIGGER_CHOICE_COUNT,
  MAX_TRIGGER_MOVE_DISTANCE,
  MAX_TRIGGER_PATH_FEET,
  MIN_DISPEL_LEVEL,
  MIN_EFFECT_MOVE_COST_FEET,
  MIN_REVIVE_HP,
  MIN_SPELL_SLOT_LEVEL,
  MIN_TRIGGER_CHANCE_PERCENT,
  MIN_TRIGGER_CHOICE_COUNT,
  MIN_TRIGGER_LIMIT_MAX,
  MIN_TRIGGER_MOVE_DISTANCE,
  MIN_TRIGGER_PATH_FEET,
} from './triggerTypes';
import {
  DEFAULT_ACTIVATION_AMOUNT,
  DEFAULT_EFFECT_CHANGE_PRIORITY,
  EFFECT_ACTIVATION_MODES,
  EFFECT_ESCAPE_ACTORS,
  EFFECT_ESCAPE_OUTCOMES,
  EFFECT_ORIGIN,
  EFFECT_VARIANT_PICKS,
  MAX_EFFECT_CHARGES,
  MAX_EFFECT_STAGE_LABEL_LENGTH,
  MAX_EFFECT_STAGES,
  MIN_EFFECT_CHARGES,
  parseFormNumber,
} from './types';

/** Самая длинная формула Сл срабатывания. */
const MAX_TRIGGER_DC_FORMULA_LENGTH = 200;

/** Самая длинная формула «на сколько» у уменьшения максимума хитов. */
const MAX_TRIGGER_AMOUNT_LENGTH = MAX_TRIGGER_DC_FORMULA_LENGTH;

/** Самый высокий приоритет модификатора. */
const MAX_EFFECT_CHANGE_PRIORITY = 100;

/**
 * Годные элементы списка по схеме; не список — пусто. Негодный элемент
 * выбрасывается один, а не вместе со всем списком.
 *
 * @param schema схема элемента.
 * @param candidates значение из данных.
 * @returns разобранные элементы по порядку.
 */
function parseEachValid<Schema extends z.ZodType>(
  schema: Schema,
  candidates: unknown,
): Array<z.output<Schema>> {
  if (!Array.isArray(candidates)) {
    return [];
  }

  return candidates.flatMap((candidate: unknown) => {
    const validation = schema.safeParse(candidate);

    return validation.success ? [validation.data] : [];
  });
}

/**
 * Приводит числовое поле формы к числу до проверки схемой: без приведения
 * строка из поля ввода роняла бы разбор всего поля.
 *
 * @param value значение поля как пришло.
 * @returns число, `undefined` для пустого или нечислового ввода, либо исходное
 *   значение, если это не строка и не число.
 */
function coerceOptionalNumber(value: unknown): unknown {
  return typeof value === 'number' || typeof value === 'string'
    ? parseFormNumber(value)
    : value;
}

/** Является ли значение объектом-записью, а не массивом или примитивом. */
const recordSchema = z.record(z.string(), z.unknown());

/** Длительность, когда пришедшая не разобралась: эффект без срока. */
const PERMANENT_DURATION: EffectDuration = { type: 'permanent' };

const abilitySchema = z.enum([
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
]);

const conditionKeySchema = z.enum(
  EFFECT_CONDITION_OPTIONS.map((condition) => condition.value),
);

const durationSchema: z.ZodType<EffectDuration> = z.object({
  type: z.enum([
    'permanent',
    'rounds',
    'minutes',
    'hours',
    'days',
    'turn',
    'special',
  ]),
  // Очищенное количество не должно превращать «Раунды» в «Постоянно»
  value: z.preprocess(coerceOptionalNumber, z.number().int().min(0).optional()),
  remaining: z.preprocess(
    coerceOptionalNumber,
    z.number().int().min(0).optional(),
  ),
  turnAnchor: z.enum(['carrier', 'source']).optional().catch(undefined),
  turnTiming: z.enum(['start', 'end']).optional().catch(undefined),
});

const changeSchema: z.ZodType<EffectChange> = z.object({
  key: z.string(),
  mode: z.enum([
    'add',
    'multiply',
    'override',
    'upgrade',
    'downgrade',
    'custom',
  ]),
  value: z.string(),
  condition: z.string().optional().catch(undefined),
  step: z
    .object({
      by: z
        .number()
        .int()
        .min(-MAX_EFFECT_CHANGE_STEP)
        .max(MAX_EFFECT_CHANGE_STEP),
      per: z.enum(EFFECT_CHANGE_STEP_PERIODS),
      until: z.preprocess(
        coerceOptionalNumber,
        z.number().int().optional().catch(undefined),
      ),
    })
    .optional()
    .catch(undefined),
  // Очищенный приоритет — не повод терять строку
  priority: z
    .preprocess(
      coerceOptionalNumber,
      z.number().int().min(0).max(MAX_EFFECT_CHANGE_PRIORITY),
    )
    .catch(DEFAULT_EFFECT_CHANGE_PRIORITY),
});

const damagePartSchema: z.ZodType<EffectDamagePart> = z.object({
  formula: z.string(),
  type: z.string().optional().catch(undefined),
  target: z.enum(['selected', 'self', 'choose']).optional().catch(undefined),
  requiresDamage: z.boolean().optional().catch(undefined),
});

/** Части урона по одной: негодная часть не уносит соседние. */
const damagePartsSchema = z
  .array(z.unknown())
  .transform((rawParts) => parseEachValid(damagePartSchema, rawParts));

const auraSchema: z.ZodType<EffectAura> = z.object({
  radius: z.preprocess(coerceOptionalNumber, z.number().min(0)),
  target: z.enum(['allies', 'enemies', 'all']),
  applyToSelf: z.boolean(),
  visible: z.boolean().optional().catch(undefined),
  radiusFormula: z.string().trim().min(1).optional().catch(undefined),
  whileCapable: z.literal(true).optional().catch(undefined),
});

/** Самая длинная строка группы и подписи варианта. */
const MAX_VARIANT_TEXT_LENGTH = 100;

/** Самый длинный ключ счётчика применения. */
const MAX_ACTIVATION_COUNTER_LENGTH = 100;

const variantSchema: z.ZodType<EffectVariant> = z.object({
  group: z.string().trim().min(1).max(MAX_VARIANT_TEXT_LENGTH),
  label: z.string().trim().min(1).max(MAX_VARIANT_TEXT_LENGTH),
  pick: z.enum(EFFECT_VARIANT_PICKS).optional().catch(undefined),
});

const activationSchema: z.ZodType<EffectActivation> = z.object({
  mode: z.enum(EFFECT_ACTIVATION_MODES),
  counter: z
    .string()
    .trim()
    .min(1)
    .max(MAX_ACTIVATION_COUNTER_LENGTH)
    .optional()
    .catch(undefined),
  amount: z.preprocess(
    coerceOptionalNumber,
    z.number().int().min(DEFAULT_ACTIVATION_AMOUNT).optional(),
  ),
});

/** Сложность спасброска: число, в том числе набранное строкой. */
const saveDcSchema = z.preprocess(coerceOptionalNumber, z.number().int());

const saveSchema: z.ZodType<EffectSave> = z.object({
  ability: abilitySchema,
  dc: saveDcSchema,
  onSuccess: z.enum(['negate', 'half']),
  allowWilling: z.literal(true).optional().catch(undefined),
});

const recurringSaveSchema: z.ZodType<EffectRecurringSave> = z.object({
  ability: abilitySchema,
  dc: saveDcSchema,
  timing: z.enum(['startOfTurn', 'endOfTurn']),
});

const recurringDamageSchema: z.ZodType<EffectRecurringDamage> = z.object({
  damageParts: damagePartsSchema,
  timing: z.enum(['startOfTurn', 'endOfTurn']),
  save: saveSchema.optional().catch(undefined),
});

/** Спасбросок срабатывания. */
const triggerSaveSchema = z.object({
  ability: abilitySchema,
  dc: saveDcSchema,
  mode: z.enum(EFFECT_TRIGGER_SAVE_MODES).optional().catch(undefined),
  dcFormula: z
    .string()
    .trim()
    .min(1)
    .max(MAX_TRIGGER_DC_FORMULA_LENGTH)
    .optional()
    .catch(undefined),
  modeIf: z
    .array(
      z.object({
        condition: z.string().trim().min(1),
        mode: z.enum(EFFECT_TRIGGER_SAVE_MODES),
      }),
    )
    .max(MAX_SAVE_MODE_RULES)
    .optional()
    .catch(undefined),
  autoSuccessIf: z.string().trim().min(1).optional().catch(undefined),
  autoFailIf: z.string().trim().min(1).optional().catch(undefined),
});

/** Гейт действия срабатывания. */
const triggerGateSchema = z
  .enum(EFFECT_TRIGGER_ACTION_GATES)
  .optional()
  .catch(undefined);

/**
 * Действие срабатывания. Негодное действие (незнакомый вид, ключ отметки не по
 * образцу, отрицательные хиты) уносит своё срабатывание целиком: без него
 * срабатывание делало бы не то, что задумано.
 */
/** Лимит срабатывания. */
const triggerLimitSchema = z.object({
  max: z.preprocess(
    coerceOptionalNumber,
    z.number().int().min(MIN_TRIGGER_LIMIT_MAX),
  ),
  per: z.enum(EFFECT_TRIGGER_LIMIT_PERIODS),
  key: z.string().min(1).optional().catch(undefined),
});

/** Футы перемещения, которыми платят цену `move`. */
const moveCostFeetSchema = z.preprocess(
  coerceOptionalNumber,
  z
    .number()
    .int()
    .min(MIN_EFFECT_MOVE_COST_FEET)
    .max(MAX_EFFECT_MOVE_COST_FEET)
    .optional()
    .catch(undefined),
);

const plainTriggerActionSchemas = [
  z.object({
    type: z.literal('damage'),
    parts: damagePartsSchema,
    on: triggerGateSchema,
    halfOnSave: z.literal(true).optional().catch(undefined),
  }),
  z.object({ type: z.literal('applySelf'), on: triggerGateSchema }),
  z.object({
    type: z.literal('applyTag'),
    tag: z.string().regex(EFFECT_TAG_PATTERN),
    label: z.string().min(1).optional().catch(undefined),
    duration: durationSchema.optional().catch(undefined),
    stack: z.literal(true).optional().catch(undefined),
    on: triggerGateSchema,
  }),
  z.object({
    type: z.literal('reduceMaxHp'),
    amount: z.string().trim().min(1).max(MAX_TRIGGER_AMOUNT_LENGTH),
    endsOnRest: z
      .enum(EFFECT_TRIGGER_MAX_HP_REST_ENDS)
      .optional()
      .catch(undefined),
    on: triggerGateSchema,
  }),
  z.object({
    type: z.literal('setHp'),
    value: z.preprocess(coerceOptionalNumber, z.number().int().min(0)),
    toMax: z.literal(true).optional().catch(undefined),
    on: triggerGateSchema,
  }),
  z.object({
    type: z.literal('tempHp'),
    amount: z.string().trim().min(1).max(MAX_TRIGGER_AMOUNT_LENGTH),
    mode: z.enum(EFFECT_TEMP_HP_MODES).optional().catch(undefined),
    on: triggerGateSchema,
  }),
  z.object({
    type: z.literal('removeCondition'),
    conditionKey: z.string().min(1).optional().catch(undefined),
    on: triggerGateSchema,
  }),
  z.object({ type: z.literal('kill'), on: triggerGateSchema }),
  z.object({
    type: z.literal('revive'),
    hp: z.preprocess(
      coerceOptionalNumber,
      z.number().int().min(MIN_REVIVE_HP).optional().catch(undefined),
    ),
    full: z.literal(true).optional().catch(undefined),
    on: triggerGateSchema,
  }),
  z.object({ type: z.literal('dropHeld'), on: triggerGateSchema }),
  z.object({
    type: z.literal('restore'),
    what: z.enum(EFFECT_RESTORE_KINDS),
    level: z.preprocess(
      coerceOptionalNumber,
      z
        .number()
        .int()
        .min(MIN_SPELL_SLOT_LEVEL)
        .max(MAX_SPELL_SLOT_LEVEL)
        .optional()
        .catch(undefined),
    ),
    counter: z
      .string()
      .trim()
      .min(1)
      .max(MAX_ACTIVATION_COUNTER_LENGTH)
      .optional()
      .catch(undefined),
    amount: z.preprocess(
      coerceOptionalNumber,
      z.number().int().min(1).optional().catch(undefined),
    ),
    on: triggerGateSchema,
  }),
  z.object({
    type: z.literal('dispel'),
    maxLevel: z.preprocess(
      coerceOptionalNumber,
      z.number().int().min(MIN_DISPEL_LEVEL).max(MAX_SPELL_SLOT_LEVEL),
    ),
    withoutLevel: z.literal(true).optional().catch(undefined),
    on: triggerGateSchema,
  }),
  z.object({ type: z.literal('grantInspiration'), on: triggerGateSchema }),
  z.object({
    type: z.literal('move'),
    kind: z.enum(EFFECT_TRIGGER_MOVE_KINDS),
    distance: z.preprocess(
      coerceOptionalNumber,
      z
        .number()
        .int()
        .min(MIN_TRIGGER_MOVE_DISTANCE)
        .max(MAX_TRIGGER_MOVE_DISTANCE),
    ),
    from: z.enum(EFFECT_TRIGGER_MOVE_ORIGINS).optional().catch(undefined),
    on: triggerGateSchema,
  }),
  z.object({
    type: z.literal('moveArea'),
    kind: z.enum(EFFECT_TRIGGER_AREA_SHIFT_KINDS),
    distance: z.preprocess(
      coerceOptionalNumber,
      z
        .number()
        .int()
        .min(MIN_TRIGGER_MOVE_DISTANCE)
        .max(MAX_TRIGGER_MOVE_DISTANCE)
        .optional()
        .catch(undefined),
    ),
    on: triggerGateSchema,
  }),
  z.object({
    type: z.literal('endCast'),
    whose: z.enum(EFFECT_CAST_OWNERS).optional().catch(undefined),
    on: triggerGateSchema,
  }),
  z.object({
    type: z.literal('notify'),
    text: z.string().trim().min(1).max(MAX_NOTIFY_TEXT_LENGTH),
    to: z.enum(EFFECT_NOTIFY_TARGETS).optional().catch(undefined),
    roll: z
      .string()
      .trim()
      .min(1)
      .max(MAX_TRIGGER_DC_FORMULA_LENGTH)
      .optional()
      .catch(undefined),
    on: triggerGateSchema,
  }),
  z.object({ type: z.literal('nextStage'), on: triggerGateSchema }),
  z.object({ type: z.literal('removeSelf'), on: triggerGateSchema }),
] as const;

/** Поля наложения состояния без собственных срабатываний. */
const applyConditionActionShape = {
  type: z.literal('applyCondition'),
  conditionKey: z.string().min(1),
  duration: durationSchema.optional().catch(undefined),
  recurringSave: recurringSaveSchema.optional().catch(undefined),
  locked: z.literal(true).optional().catch(undefined),
  endsOnExit: z.literal(true).optional().catch(undefined),
  on: triggerGateSchema,
} as const;

/** Действие вложенного срабатывания: своих срабатываний у него уже нет. */
const nestedTriggerActionSchema = z.discriminatedUnion('type', [
  ...plainTriggerActionSchemas,
  z.object(applyConditionActionShape),
]);

/**
 * Общие поля срабатывания — без действий: у вложенного они те же, отличается
 * только список действий.
 */
const triggerShape = {
  id: z.string().min(1),
  event: z.enum([...EFFECT_TRIGGER_EVENTS, ...EFFECT_TRIGGER_RESERVED_EVENTS]),
  turnOf: z.enum(EFFECT_TRIGGER_TURN_OWNERS).optional().catch(undefined),
  role: z.enum(EFFECT_TRIGGER_ATTACK_ROLES).optional().catch(undefined),
  restType: z.enum(EFFECT_TRIGGER_REST_TYPES).optional().catch(undefined),
  recipient: z.enum(EFFECT_TRIGGER_RECIPIENTS).optional().catch(undefined),
  area: z
    .object({
      radius: z.preprocess(coerceOptionalNumber, z.number().min(0)),
      target: z.enum(EFFECT_TRIGGER_AREA_TARGETS).optional().catch(undefined),
    })
    .optional()
    .catch(undefined),
  choice: z
    .object({
      radius: z.preprocess(coerceOptionalNumber, z.number().min(0)),
      target: z.enum(EFFECT_TRIGGER_AREA_TARGETS).optional().catch(undefined),
      count: z.preprocess(
        coerceOptionalNumber,
        z
          .number()
          .int()
          .min(MIN_TRIGGER_CHOICE_COUNT)
          .max(MAX_TRIGGER_CHOICE_COUNT)
          .optional()
          .catch(undefined),
      ),
      condition: z.string().min(1).optional().catch(undefined),
      optional: z.literal(true).optional().catch(undefined),
      chooser: z.enum(EFFECT_TRIGGER_CHOOSERS).optional().catch(undefined),
    })
    .optional()
    .catch(undefined),
  condition: z.string().min(1).optional().catch(undefined),
  save: triggerSaveSchema.optional().catch(undefined),
  limit: triggerLimitSchema.optional().catch(undefined),
  conditionKey: z.string().min(1).optional().catch(undefined),
  cost: z.enum(EFFECT_ACTION_COSTS).optional().catch(undefined),
  moveCostFeet: moveCostFeetSchema,
  everyFeet: z.preprocess(
    coerceOptionalNumber,
    z
      .number()
      .int()
      .min(MIN_TRIGGER_PATH_FEET)
      .max(MAX_TRIGGER_PATH_FEET)
      .optional()
      .catch(undefined),
  ),
  ask: z.literal(true).optional().catch(undefined),
  asker: z.enum(EFFECT_TRIGGER_CHOOSERS).optional().catch(undefined),
  chancePercent: z.preprocess(
    coerceOptionalNumber,
    z
      .number()
      .int()
      .min(MIN_TRIGGER_CHANCE_PERCENT)
      .max(MAX_TRIGGER_CHANCE_PERCENT)
      .optional()
      .catch(undefined),
  ),
} as const;

/** Вложенное срабатывание наложенного состояния. */
const nestedTriggerSchema: z.ZodType<NestedEffectTrigger> = z.object({
  ...triggerShape,
  actions: z.array(nestedTriggerActionSchema).min(1),
});

/** Вложенные срабатывания по одному — как и срабатывания эффекта. */
const nestedTriggersSchema = z
  .array(z.unknown())
  .transform((rawTriggers) => parseEachValid(nestedTriggerSchema, rawTriggers));

const triggerActionSchema = z.discriminatedUnion('type', [
  ...plainTriggerActionSchemas,
  z.object({
    ...applyConditionActionShape,
    triggers: nestedTriggersSchema.optional().catch(undefined),
  }),
]);

/**
 * Срабатывание. События следующих фаз разбираются, чтобы форма их не стирала.
 */
const triggerSchema: z.ZodType<EffectTrigger> = z.object({
  ...triggerShape,
  actions: z.array(triggerActionSchema).min(1),
});

/** Срабатывания по одному: незнакомое событие выбрасывает одно срабатывание. */
const triggersSchema = z
  .array(z.unknown())
  .transform((rawTriggers) => parseEachValid(triggerSchema, rawTriggers));

/**
 * Проверяет, что значение — непустая строка флага.
 *
 * По словарю сайта флаги НЕ сверяются: словарь отстаёт от системы, и такая
 * сверка молча стирала флаги, которые VTTG понимает (`healing.blocked`,
 * `save.evasion.*`). Незнакомый флаг сохраняется как есть, а форма показывает
 * его сырым ключом с пометкой «неизвестный флаг».
 *
 * @param flag произвольное значение из списка флагов.
 * @returns `true`, если это непустая строка.
 */
function isEffectFlagValue(flag: unknown): flag is string {
  return typeof flag === 'string' && flag.trim().length > 0;
}

/** Строки модификаторов по одной: негодная строка не уносит соседние. */
const changesSchema = z
  .array(z.unknown())
  .transform((rawChanges) => parseEachValid(changeSchema, rawChanges));

/** Флаги: непустые строки, словарём сайта не сверяются. */
const flagsSchema = z
  .array(z.unknown())
  .transform((rawFlags) => rawFlags.filter(isEffectFlagValue));

/** Ключи навыков словаря VTTG: проверку «вырваться» с чужим ключом не бросить. */
const SKILL_KEYS: ReadonlySet<string> = new Set(
  EFFECT_SKILL_OPTIONS.map((skill) => skill.value),
);

/** Заряды эффекта. */
const chargesSchema: z.ZodType<EffectCharges> = z.object({
  max: z.preprocess(
    coerceOptionalNumber,
    z.number().int().min(MIN_EFFECT_CHARGES).max(MAX_EFFECT_CHARGES),
  ),
  current: z.preprocess(
    coerceOptionalNumber,
    z.number().int().min(0).max(MAX_EFFECT_CHARGES),
  ),
  endsWhenEmpty: z.literal(true).optional().catch(undefined),
});

/** Действие «вырваться». */
const escapeSchema: z.ZodType<EffectEscape> = z.object({
  by: z.enum(EFFECT_ESCAPE_ACTORS).optional().catch(undefined),
  cost: z.enum(EFFECT_ACTION_COSTS).optional().catch(undefined),
  moveCostFeet: moveCostFeetSchema,
  check: z
    .object({
      skill: z.string().refine((skill) => SKILL_KEYS.has(skill)),
      dc: saveDcSchema,
    })
    .optional()
    .catch(undefined),
  onSuccess: z.enum(EFFECT_ESCAPE_OUTCOMES).optional().catch(undefined),
  label: z
    .string()
    .trim()
    .min(1)
    .max(MAX_EFFECT_STAGE_LABEL_LENGTH)
    .optional()
    .catch(undefined),
});

/** Ступень эффекта. */
const stageSchema: z.ZodType<EffectStage> = z.object({
  label: z.string().trim().min(1).max(MAX_EFFECT_STAGE_LABEL_LENGTH),
  changes: changesSchema.catch([]),
  flags: flagsSchema.catch([]),
});

/** Эффект. */
const activeEffectSchema: z.ZodType<ActiveEffect> = z.object({
  id: z.string().min(1),
  name: z.string(),
  description: z.string().catch(''),
  icon: z.string().optional().catch(undefined),
  disabled: z.boolean().catch(false),
  origin: z.enum(EFFECT_ORIGIN).catch(EFFECT_ORIGIN.manual),
  originId: z.string().optional().catch(undefined),
  transfer: z.boolean().catch(false),
  // Длительность не объектом уносит эффект; объект с негодным типом — только
  // срок: бонусы эффекта дороже его длительности
  duration: recordSchema.transform((rawDuration) => {
    const parsedDuration = durationSchema.safeParse(rawDuration);

    return parsedDuration.success ? parsedDuration.data : PERMANENT_DURATION;
  }),
  changes: changesSchema,
  flags: flagsSchema,
  aura: auraSchema.optional().catch(undefined),
  areaTrigger: z.enum(['stay', 'enter', 'exit']).optional().catch(undefined),
  // Незнакомая доставка обнуляет поле, а не отвергает эффект
  effectTarget: z.enum(['self', 'target', 'zone']).optional().catch(undefined),
  conditionKey: conditionKeySchema.optional().catch(undefined),
  landingCondition: z.string().trim().min(1).optional().catch(undefined),
  variant: variantSchema.optional().catch(undefined),
  rollCondition: z.string().trim().min(1).optional().catch(undefined),
  activation: activationSchema.optional().catch(undefined),
  charges: chargesSchema.optional().catch(undefined),
  savedRoll: z.string().trim().min(1).optional().catch(undefined),
  durationFormula: z.string().trim().min(1).optional().catch(undefined),
  applySave: saveSchema.optional().catch(undefined),
  applyOnSuccess: z.boolean().optional().catch(undefined),
  applyOnSuccessOnly: z.boolean().optional().catch(undefined),
  consumeOn: z
    .enum(['carrierAttack', 'attackOnCarrier'])
    .optional()
    .catch(undefined),
  damageParts: damagePartsSchema.optional().catch(undefined),
  recurringSave: recurringSaveSchema.optional().catch(undefined),
  recurringDamage: recurringDamageSchema.optional().catch(undefined),
  triggers: triggersSchema.optional().catch(undefined),
  suppressConditions: z.array(z.string().min(1)).optional().catch(undefined),
  conditionImmunities: z
    .array(z.unknown())
    .transform((rawKeys) => parseEachValid(conditionKeySchema, rawKeys))
    .optional()
    .catch(undefined),
  exhaustionLevel: z
    .preprocess(coerceOptionalNumber, z.number().int().min(0).optional())
    .catch(undefined),
  escape: escapeSchema.optional().catch(undefined),
  stages: z
    .array(stageSchema)
    .max(MAX_EFFECT_STAGES)
    .optional()
    .catch(undefined),
  stageIndex: z.preprocess(
    coerceOptionalNumber,
    z
      .number()
      .int()
      .min(0)
      .max(MAX_EFFECT_STAGES - 1)
      .optional()
      .catch(undefined),
  ),
});

/**
 * Переносит легаси-поле `type` части урона в токен формулы.
 *
 * Тип урона задаётся токеном формулы (`@dmg.fire`), а прежний редактор писал
 * его отдельным полем. Без переноса такая часть в форме выглядела бы «без
 * типа»: форма правит формулу, а поля `type` в ней нет. Лечение типа урона не
 * получает — токен лечения распознаётся тем же правилом, что в описании.
 *
 * @param part часть урона, как её отдал сервер.
 * @returns часть, у которой тип живёт в формуле.
 */
function migrateEffectDamagePart(part: EffectDamagePart): EffectDamagePart {
  const formula = part.formula;
  const hasTypeToken = formula.includes('@dmg.') || isHealingDamagePart(part);

  if (!part.type || hasTypeToken) {
    return { ...part, type: undefined };
  }

  return { ...part, formula: `${formula}@dmg.${part.type}`, type: undefined };
}

/**
 * Переносит легаси-типы урона в действиях срабатывания.
 *
 * @param trigger срабатывание.
 * @returns срабатывание с типами урона в формулах.
 */
function migrateTriggerDamageParts(trigger: EffectTrigger): EffectTrigger {
  return {
    ...trigger,
    actions: trigger.actions.map((action) =>
      action.type === 'damage'
        ? { ...action, parts: action.parts.map(migrateEffectDamagePart) }
        : action,
    ),
  };
}

/**
 * Переносит легаси-типы урона во всех частях эффекта: при наложении, в
 * периодическом уроне и в действиях срабатываний.
 *
 * @param effect загруженный эффект.
 * @returns эффект с типами урона в формулах.
 */
function migrateLoadedActiveEffect(effect: ActiveEffect): ActiveEffect {
  return {
    ...effect,
    damageParts: effect.damageParts?.map(migrateEffectDamagePart),
    recurringDamage: effect.recurringDamage
      ? {
          ...effect.recurringDamage,
          damageParts: effect.recurringDamage.damageParts.map(
            migrateEffectDamagePart,
          ),
        }
      : undefined,
    triggers: effect.triggers?.map(migrateTriggerDamageParts),
  };
}

/**
 * Нормализует массив активных эффектов, загруженный с сервера. Каждый эффект
 * разбирается терпимо и отдельно — одна битая запись не обнуляет весь список.
 *
 * @param rawEffects значение поля `activeEffects` из ответа.
 * @returns эффекты, которые удалось разобрать.
 */
export function normalizeLoadedActiveEffects(
  rawEffects: unknown,
): ActiveEffect[] {
  return parseEachValid(activeEffectSchema, rawEffects).map(
    migrateLoadedActiveEffect,
  );
}
