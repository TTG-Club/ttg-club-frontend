/**
 * Фраза срабатывания для сводки эффекта.
 *
 * Срабатывания, которые выражает старое поле (урон каждый ход, повторный
 * спасбросок, снятие после атаки), описываются прежними фразами — сводка
 * существующих эффектов не меняется. Остальные собираются из частей: когда,
 * при каком условии, какой спасбросок, что при провале и успехе, как часто.
 *
 * Зеркало: dnd5-test-migrate/src/engine/effectTriggerDescribe.ts
 */

import type { TriggerConditionPart } from './triggerConditions';
import type {
  EffectTrigger,
  EffectTriggerAction,
  EffectTriggerChoice,
  EffectTriggerSaveMode,
} from './triggerTypes';
import type { EffectDuration } from './types';

import {
  describeEffectCreatureSize,
  EFFECT_ABILITY_GENITIVE_LABELS,
  EFFECT_PHRASE_PARTS,
  EFFECT_SAVE_TIMING_LABELS,
  EFFECT_TRIGGER_AREA_SHIFT_PHRASES,
  EFFECT_TRIGGER_AREA_TARGET_PHRASES,
  EFFECT_TRIGGER_ATTACK_ROLE_PHRASES,
  EFFECT_TRIGGER_CONDITION_PHRASES,
  EFFECT_TRIGGER_CONSUME_ON_PHRASES,
  EFFECT_TRIGGER_EVENT_PHRASES,
  EFFECT_TRIGGER_MOVE_KIND_PHRASES,
  EFFECT_TRIGGER_PERIOD_LABELS,
  EFFECT_TRIGGER_PHRASE_PARTS,
  EFFECT_TRIGGER_RECURRING_DAMAGE_SUCCESS_LABELS,
  EFFECT_TRIGGER_REST_EVENT_PHRASES,
  EFFECT_TRIGGER_REST_UNTIL_PHRASES,
  EFFECT_TRIGGER_TEMP_HP_PHRASES,
  EVENT_DAMAGE_VARIABLE,
  TRIGGER_ATTACK_KIND_PHRASES,
} from './constants';
import {
  describeAbilityName,
  describeConditionName,
  describeCreatureType,
  describeDamageTypeShort,
  describeEffectChangeCondition,
  describeEffectDamageParts,
  describeEffectDuration,
} from './describe';
import {
  DEFAULT_ABILITY_THRESHOLD,
  DEFAULT_TAG_COUNT_THRESHOLD,
  getTriggerConditionParameter,
  isTriggerAttackKind,
  readTriggerConditionParts,
} from './triggerConditions';
import {
  classifyLegacyTrigger,
  isTurnTriggerEvent,
  resolveTriggerActionGate,
  saveTimingOfTriggerEvent,
  triggerEventHasPathFeet,
  triggerEventHasRestType,
} from './triggers';
import {
  APPLIER_TRIGGER_RECIPIENT,
  AREA_TRIGGER_RECIPIENT,
  CHOICE_TRIGGER_RECIPIENT,
  DEFAULT_CAST_OWNER,
  DEFAULT_TEMP_HP_MODE,
  DEFAULT_TRIGGER_AREA_TARGET,
  DEFAULT_TRIGGER_CHOICE_COUNT,
  DEFAULT_TRIGGER_CHOOSER,
  DEFAULT_TRIGGER_MOVE_DISTANCE,
  DEFAULT_TRIGGER_REST_TYPE,
  MAX_HP_REDUCTION_NEVER_ENDS,
  MIN_REVIVE_HP,
  MIN_SPELL_SLOT_LEVEL,
  MIN_TRIGGER_LIMIT_MAX,
} from './triggerTypes';

/**
 * Подпись вида атаки.
 *
 * @param attackKind ключ вида.
 * @returns подпись либо ключ.
 */
function describeAttackKind(attackKind: string): string {
  return isTriggerAttackKind(attackKind)
    ? TRIGGER_ATTACK_KIND_PHRASES[attackKind]
    : attackKind;
}

/** Настройки фразы. */
export interface EffectTriggerDescribeOptions {
  /** Подпись Сл (0 — Сл источника по месту формы). */
  formatDc: (dc: number) => string;
}

/**
 * Подпись значения части условия: тип урона, тип существа, размер и состояние —
 * словами, ключ отметки и число — как есть.
 *
 * @param part разобранная часть условия.
 * @returns подпись значения; у части без значения — пустая строка.
 */
function describeTriggerConditionValue(part: TriggerConditionPart): string {
  const value = part.value ?? '';

  switch (getTriggerConditionParameter(part.kind)) {
    case 'damageType':
      return describeDamageTypeShort(value);
    case 'creatureType':
      return describeCreatureType(value);
    case 'size':
      return describeEffectCreatureSize(value);
    case 'condition':
      return describeConditionName(value);
    case 'ability':
      return describeAbilityName(value);
    case 'attackKind':
      return describeAttackKind(value);
    default:
      return value;
  }
}

/**
 * Порог части условия: у характеристики и у счётчика отметок свои умолчания.
 *
 * @param part разобранная часть условия.
 * @returns порог.
 */
function describeTriggerConditionAmount(part: TriggerConditionPart): number {
  const defaultAmount =
    getTriggerConditionParameter(part.kind) === 'ability'
      ? DEFAULT_ABILITY_THRESHOLD
      : DEFAULT_TAG_COUNT_THRESHOLD;

  return part.amount ?? defaultAmount;
}

/**
 * Подпись условия срабатывания: части словаря срабатываний — фразой, остальные
 * — как у модификаторов (незнакомая часть остаётся кодом).
 *
 * @param condition условие срабатывания.
 * @returns подпись.
 */
export function describeTriggerCondition(condition: string): string {
  return readTriggerConditionParts(condition)
    .map((part) =>
      typeof part === 'string'
        ? describeEffectChangeCondition(part)
        : EFFECT_TRIGGER_CONDITION_PHRASES[part.kind](
            describeTriggerConditionValue(part),
            describeTriggerConditionAmount(part),
          ),
    )
    .join(EFFECT_PHRASE_PARTS.andJoiner);
}

/**
 * Подпись наложенного со сроком, если он задан: «„Отравлен“ на 1 раунд».
 *
 * @param name подпись наложенного.
 * @param duration срок; без него — до снятия или срок по умолчанию.
 * @returns подпись.
 */
function withDurationSuffix(
  name: string,
  duration: EffectDuration | undefined,
): string {
  const suffix = duration ? describeEffectDuration(duration) : null;

  return suffix ? `${name} ${suffix}` : name;
}

/**
 * Подпись действия.
 *
 * @param action действие.
 * @param describeOptions настройки фразы.
 * @returns подпись либо пустая строка, если описывать нечего.
 */
function describeAction(
  action: EffectTriggerAction,
  describeOptions: EffectTriggerDescribeOptions,
): string {
  switch (action.type) {
    case 'damage':
      return describeEffectDamageParts(action.parts);
    case 'applySelf':
      return EFFECT_TRIGGER_PHRASE_PARTS.effect;
    case 'applyCondition': {
      const named = `«${describeConditionName(action.conditionKey)}»`;

      const condition = action.endsOnExit
        ? `${named}${EFFECT_TRIGGER_PHRASE_PARTS.endsOnExitSuffix}`
        : withDurationSuffix(named, action.duration);

      if (!action.recurringSave) {
        return condition;
      }

      const { ability, dc, timing } = action.recurringSave;

      return `${condition} (${EFFECT_TRIGGER_PHRASE_PARTS.recurringSavePrefix}${EFFECT_ABILITY_GENITIVE_LABELS[ability]} ${describeOptions.formatDc(dc)} ${EFFECT_SAVE_TIMING_LABELS[timing]}${EFFECT_TRIGGER_PHRASE_PARTS.recurringSaveSuffix})`;
    }
    case 'applyTag':
      return withDurationSuffix(
        `${EFFECT_TRIGGER_PHRASE_PARTS.tagPrefix}«${action.label ?? action.tag}»${action.stack ? EFFECT_TRIGGER_PHRASE_PARTS.stackSuffix : ''}`,
        action.duration,
      );
    case 'reduceMaxHp': {
      const amount = action.amount.replaceAll(
        `@${EVENT_DAMAGE_VARIABLE}`,
        EFFECT_TRIGGER_PHRASE_PARTS.damageVariable,
      );

      const endsOnRest = action.endsOnRest ?? DEFAULT_TRIGGER_REST_TYPE;

      const until =
        endsOnRest === MAX_HP_REDUCTION_NEVER_ENDS
          ? ''
          : EFFECT_TRIGGER_REST_UNTIL_PHRASES[endsOnRest];

      return `${EFFECT_TRIGGER_PHRASE_PARTS.maxHpPrefix}${amount}${until}`;
    }
    case 'setHp':
      return action.toMax
        ? EFFECT_TRIGGER_PHRASE_PARTS.setHpMax
        : `${EFFECT_TRIGGER_PHRASE_PARTS.setHpPrefix}${action.value}`;
    case 'tempHp':
      return `${EFFECT_TRIGGER_TEMP_HP_PHRASES[action.mode ?? DEFAULT_TEMP_HP_MODE]}${action.amount}`;
    case 'removeCondition':
      return action.conditionKey
        ? `${EFFECT_TRIGGER_PHRASE_PARTS.removeConditionPrefix}«${describeConditionName(action.conditionKey)}»`
        : EFFECT_TRIGGER_PHRASE_PARTS.removeAllConditions;
    case 'kill':
      return EFFECT_TRIGGER_PHRASE_PARTS.kill;
    case 'revive':
      return action.full
        ? EFFECT_TRIGGER_PHRASE_PARTS.reviveFull
        : `${EFFECT_TRIGGER_PHRASE_PARTS.revivePrefix}${action.hp ?? MIN_REVIVE_HP}`;
    case 'dropHeld':
      return EFFECT_TRIGGER_PHRASE_PARTS.dropHeld;
    case 'restore':
      return action.what === 'spellSlot'
        ? `${EFFECT_TRIGGER_PHRASE_PARTS.restoreSlotPrefix}${action.level ?? MIN_SPELL_SLOT_LEVEL}`
        : `${EFFECT_TRIGGER_PHRASE_PARTS.restoreCounterPrefix}«${action.counter ?? ''}»`;
    case 'dispel':
      return `${EFFECT_TRIGGER_PHRASE_PARTS.dispelPrefix}${action.maxLevel}`;
    case 'grantInspiration':
      return EFFECT_TRIGGER_PHRASE_PARTS.grantInspiration;
    case 'move':
      return `${EFFECT_TRIGGER_MOVE_KIND_PHRASES[action.kind]}${action.distance}${EFFECT_TRIGGER_PHRASE_PARTS.moveSuffix}`;
    case 'moveArea':
      return action.kind === 'follow'
        ? EFFECT_TRIGGER_AREA_SHIFT_PHRASES.follow
        : `${EFFECT_TRIGGER_AREA_SHIFT_PHRASES[action.kind]}${action.distance ?? DEFAULT_TRIGGER_MOVE_DISTANCE}${EFFECT_TRIGGER_PHRASE_PARTS.moveSuffix}`;
    case 'notify':
      return `${EFFECT_TRIGGER_PHRASE_PARTS.notifyPrefix}«${action.text}»`;
    case 'nextStage':
      return EFFECT_TRIGGER_PHRASE_PARTS.nextStage;
    case 'endCast':
      return (action.whose ?? DEFAULT_CAST_OWNER) === 'recipient'
        ? EFFECT_TRIGGER_PHRASE_PARTS.endRecipientCast
        : EFFECT_TRIGGER_PHRASE_PARTS.endCast;
    case 'removeSelf':
      return EFFECT_TRIGGER_PHRASE_PARTS.removeSelf;
    default:
      return '';
  }
}

/**
 * Подпись действий, которые выполнятся при данном исходе спасброска.
 *
 * @param trigger срабатывание.
 * @param saved пройден ли спасбросок.
 * @param describeOptions настройки фразы.
 * @returns перечисление либо «ничего».
 */
function describeOutcomeActions(
  trigger: EffectTrigger,
  saved: boolean,
  describeOptions: EffectTriggerDescribeOptions,
): string {
  const parts = trigger.actions.flatMap((action) => {
    const gate = resolveTriggerActionGate(trigger, action);

    if (gate === (saved ? 'failed' : 'saved')) {
      return [];
    }

    if (saved && action.type === 'damage' && action.halfOnSave) {
      return [EFFECT_PHRASE_PARTS.halfDamage];
    }

    const label = describeAction(action, describeOptions);

    return label ? [label] : [];
  });

  return parts.length > 0
    ? parts.join(EFFECT_PHRASE_PARTS.listJoiner)
    : EFFECT_PHRASE_PARTS.nothing;
}

/**
 * Когда срабатывает.
 *
 * @param trigger срабатывание.
 * @returns подпись момента.
 */
function describeMoment(trigger: EffectTrigger): string {
  if (trigger.event === 'attackRoll' && trigger.role) {
    return EFFECT_TRIGGER_ATTACK_ROLE_PHRASES[trigger.role];
  }

  if (triggerEventHasRestType(trigger.event)) {
    return EFFECT_TRIGGER_REST_EVENT_PHRASES[
      trigger.restType ?? DEFAULT_TRIGGER_REST_TYPE
    ];
  }

  if (triggerEventHasPathFeet(trigger.event) && trigger.everyFeet) {
    return `${EFFECT_TRIGGER_PHRASE_PARTS.pathStepPrefix}${trigger.everyFeet}${EFFECT_TRIGGER_PHRASE_PARTS.pathStepSuffix}`;
  }

  const label = EFFECT_TRIGGER_EVENT_PHRASES[trigger.event];

  return isTurnTriggerEvent(trigger.event) && trigger.turnOf === 'source'
    ? `${label}${EFFECT_TRIGGER_PHRASE_PARTS.applierTurnSuffix}`
    : label;
}

/**
 * Прежняя фраза срабатывания, которое выражает старое поле.
 *
 * @param trigger срабатывание.
 * @param describeOptions настройки фразы.
 * @returns фраза, пустая строка (описывать нечего) либо `null`, если это не
 *   старое поле.
 */
function describeLegacyShape(
  trigger: EffectTrigger,
  describeOptions: EffectTriggerDescribeOptions,
): string | null {
  const kind = classifyLegacyTrigger(trigger);
  const [action] = trigger.actions;

  const timing =
    EFFECT_SAVE_TIMING_LABELS[saveTimingOfTriggerEvent(trigger.event)];

  if (kind === 'recurringDamage' && action?.type === 'damage') {
    const damage = describeEffectDamageParts(action.parts);

    if (!damage) {
      return '';
    }

    const { save } = trigger;

    const saveClause = save
      ? ` (${EFFECT_PHRASE_PARTS.savePrefix}${EFFECT_ABILITY_GENITIVE_LABELS[save.ability]}, ${describeOptions.formatDc(save.dc)}${EFFECT_TRIGGER_PHRASE_PARTS.damageSaveSuccess}${EFFECT_TRIGGER_RECURRING_DAMAGE_SUCCESS_LABELS[action.halfOnSave ? 'half' : 'negate']})`
      : '';

    return `${EFFECT_TRIGGER_PHRASE_PARTS.everyTurnPrefix}${damage} ${timing}${saveClause}`;
  }

  if (kind === 'recurringSave' && trigger.save) {
    const { ability, dc } = trigger.save;

    return `${EFFECT_TRIGGER_PHRASE_PARTS.recurringSavePrefix}${EFFECT_ABILITY_GENITIVE_LABELS[ability]} ${describeOptions.formatDc(dc)} ${timing}${EFFECT_TRIGGER_PHRASE_PARTS.recurringSaveSuffix}`;
  }

  if (kind === 'consumeOn' && trigger.role) {
    return EFFECT_TRIGGER_CONSUME_ON_PHRASES[trigger.role];
  }

  return null;
}

/**
 * Кому достаются действия — часть фразы.
 *
 * @param trigger срабатывание.
 * @returns часть фразы; субъект — пусто.
 */
function describeTriggerRecipient(trigger: EffectTrigger): string {
  if (trigger.recipient === 'other') {
    return EFFECT_TRIGGER_PHRASE_PARTS.recipientOther;
  }

  if (trigger.recipient === APPLIER_TRIGGER_RECIPIENT) {
    return EFFECT_TRIGGER_PHRASE_PARTS.recipientApplier;
  }

  if (trigger.recipient === CHOICE_TRIGGER_RECIPIENT && trigger.choice) {
    return describeTriggerChoice(trigger.choice);
  }

  if (trigger.recipient !== AREA_TRIGGER_RECIPIENT || !trigger.area) {
    return '';
  }

  const target =
    EFFECT_TRIGGER_AREA_TARGET_PHRASES[
      trigger.area.target ?? DEFAULT_TRIGGER_AREA_TARGET
    ];

  return `${EFFECT_TRIGGER_PHRASE_PARTS.recipientAreaPrefix}${target} в ${trigger.area.radius}${EFFECT_TRIGGER_PHRASE_PARTS.recipientAreaSuffix}`;
}

/**
 * Получатель «по выбору» — часть фразы: «, на 1 из союзников в 30 фт вокруг по
 * выбору наложившего».
 *
 * @param choice блок «по выбору».
 * @returns часть фразы.
 */
function describeTriggerChoice(choice: EffectTriggerChoice): string {
  const {
    recipientChoicePrefix,
    recipientChoiceTargetPrefix,
    recipientChoiceSuffix,
    recipientChoiceChooser,
    recipientChoiceOptional,
    recipientChoiceConditionPrefix,
  } = EFFECT_TRIGGER_PHRASE_PARTS;

  const count = choice.count ?? DEFAULT_TRIGGER_CHOICE_COUNT;

  const target =
    EFFECT_TRIGGER_AREA_TARGET_PHRASES[
      choice.target ?? DEFAULT_TRIGGER_AREA_TARGET
    ];

  const chooser =
    (choice.chooser ?? DEFAULT_TRIGGER_CHOOSER) === 'source'
      ? recipientChoiceChooser
      : '';

  const condition = choice.condition
    ? `${recipientChoiceConditionPrefix}${describeTriggerCondition(choice.condition)}`
    : '';

  return [
    recipientChoicePrefix,
    count,
    recipientChoiceTargetPrefix,
    target,
    ' в ',
    choice.radius,
    recipientChoiceSuffix,
    chooser,
    condition,
    choice.optional ? recipientChoiceOptional : '',
  ].join('');
}

/**
 * Подпись режима спасброска.
 *
 * @param mode режим спасброска.
 * @returns продолжение фразы либо пустая строка.
 */
function describeSaveMode(mode: EffectTriggerSaveMode | undefined): string {
  if (mode === 'advantage') {
    return EFFECT_TRIGGER_PHRASE_PARTS.saveModeAdvantage;
  }

  return mode === 'disadvantage'
    ? EFFECT_TRIGGER_PHRASE_PARTS.saveModeDisadvantage
    : '';
}

/**
 * Лимит «не чаще N раз за период».
 *
 * @param trigger срабатывание.
 * @returns продолжение фразы либо пустая строка.
 */
function describeLimit(trigger: EffectTrigger): string {
  if (!trigger.limit) {
    return '';
  }

  const { max, per } = trigger.limit;

  const times =
    max === MIN_TRIGGER_LIMIT_MAX
      ? EFFECT_TRIGGER_PHRASE_PARTS.limitOnce
      : `${max}${EFFECT_TRIGGER_PHRASE_PARTS.limitTimes}`;

  return `${EFFECT_TRIGGER_PHRASE_PARTS.limitPrefix}${times}${EFFECT_TRIGGER_PHRASE_PARTS.limitPeriodPrefix}${EFFECT_TRIGGER_PERIOD_LABELS[per]}`;
}

/**
 * Фраза срабатывания для сводки — продолжение перечисления со строчной буквы.
 *
 * @param trigger срабатывание.
 * @param describeOptions настройки фразы.
 * @returns фраза либо пустая строка, если описывать нечего.
 */
export function describeEffectTrigger(
  trigger: EffectTrigger,
  describeOptions: EffectTriggerDescribeOptions,
): string {
  const legacy = describeLegacyShape(trigger, describeOptions);

  if (legacy !== null) {
    return legacy;
  }

  const condition = trigger.condition
    ? `${EFFECT_TRIGGER_PHRASE_PARTS.conditionPrefix}${describeTriggerCondition(trigger.condition)}`
    : '';

  const recipient = describeTriggerRecipient(trigger);

  const moment = `${describeMoment(trigger)}${condition}${recipient}`;
  const limit = describeLimit(trigger);

  if (!trigger.save) {
    return `${moment}: ${describeOutcomeActions(trigger, false, describeOptions)}${limit}`;
  }

  const { ability, dc, dcFormula, mode } = trigger.save;

  const dcLabel = dcFormula
    ? `${EFFECT_TRIGGER_PHRASE_PARTS.dcFormulaPrefix}${dcFormula.replaceAll(`@${EVENT_DAMAGE_VARIABLE}`, EFFECT_TRIGGER_PHRASE_PARTS.damageVariable)}`
    : describeOptions.formatDc(dc);

  return [
    `${moment}: ${EFFECT_PHRASE_PARTS.savePrefix}${EFFECT_ABILITY_GENITIVE_LABELS[ability]}${describeSaveMode(mode)}, ${dcLabel}`,
    `${EFFECT_TRIGGER_PHRASE_PARTS.failurePrefix}${describeOutcomeActions(trigger, false, describeOptions)}`,
    `${EFFECT_TRIGGER_PHRASE_PARTS.successPrefix}${describeOutcomeActions(trigger, true, describeOptions)}${limit}`,
  ].join(EFFECT_PHRASE_PARTS.clauseJoiner);
}
