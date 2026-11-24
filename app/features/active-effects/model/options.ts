/**
 * Варианты выбора для шагов формы эффекта: подписи зависят от места формы и
 * текущей раскладки, поэтому часть из них собирается функциями, а не лежит
 * константами.
 *
 * Зеркало: dnd5-test-migrate/src/client/ui/effect/effectFormOptions.ts
 */

import type { EffectChangeStepPeriod } from './changeSteps';
import type { EffectActivationChoice, SaveDcFieldMode } from './constants';
import type {
  EffectDelivery,
  EffectFormContext,
  EffectFormLayout,
  EffectSuccessOutcome,
} from './layout';
import type {
  TriggerAttackKind,
  TriggerConditionParameter,
} from './triggerConditions';
import type {
  EffectActionCost,
  EffectCastOwner,
  EffectNotifyTarget,
  EffectRestoreKind,
  EffectTempHpMode,
  EffectTrigger,
  EffectTriggerActionGate,
  EffectTriggerAreaShiftKind,
  EffectTriggerAreaTarget,
  EffectTriggerAttackRole,
  EffectTriggerChooser,
  EffectTriggerEvent,
  EffectTriggerLimitPeriod,
  EffectTriggerMaxHpRestEnd,
  EffectTriggerMoveKind,
  EffectTriggerMoveOrigin,
  EffectTriggerRecipient,
  EffectTriggerRestType,
  EffectTriggerSaveMode,
} from './triggerTypes';
import type {
  EffectAreaTrigger,
  EffectAuraTarget,
  EffectDuration,
  EffectDurationType,
  EffectEscapeActor,
  EffectEscapeOutcome,
  EffectSaveTiming,
  EffectTurnAnchor,
  EffectTurnTiming,
  EffectVariantPick,
} from './types';

import { upperFirst } from 'es-toolkit';

import { EFFECT_CHANGE_STEP_PERIODS } from './changeSteps';
import {
  ANY_CONDITION_KEY,
  EFFECT_ABILITY_OPTIONS,
  EFFECT_ACTION_COST_LABELS,
  EFFECT_ACTION_SAVE_OUTCOME_OPTIONS,
  EFFECT_ACTIVATION_CHOICE_LABELS,
  EFFECT_AURA_AREA_TRIGGER_LABELS,
  EFFECT_AURA_TARGET_LABELS,
  EFFECT_CARRIER_DELIVERY_LABELS,
  EFFECT_CAST_OWNER_LABELS,
  EFFECT_CHANGE_STEP_PER_LABELS,
  EFFECT_CONDITION_OPTIONS,
  EFFECT_CREATURE_CATEGORY_OPTIONS,
  EFFECT_CREATURE_SIZE_OPTIONS,
  EFFECT_DAMAGE_TYPE_OPTIONS,
  EFFECT_DELIVERY_ICONS,
  EFFECT_DELIVERY_LABELS,
  EFFECT_DURATION_HINTS,
  EFFECT_DURATION_LABELS,
  EFFECT_ESCAPE_ACTOR_LABELS,
  EFFECT_ESCAPE_OUTCOME_LABELS,
  EFFECT_NOTIFY_TARGET_LABELS,
  EFFECT_PERMANENT_ACTIVATION,
  EFFECT_RESTORE_KIND_LABELS,
  EFFECT_SAVE_DC_FIELD_MODE_LABELS,
  EFFECT_SAVE_TIMING_LABELS,
  EFFECT_SUCCESS_OUTCOME_OPTIONS,
  EFFECT_TARGET_DELIVERY_LABELS,
  EFFECT_TEMP_HP_MODE_LABELS,
  EFFECT_TRIGGER_APPLIED_OTHER_PARTY_LABEL,
  EFFECT_TRIGGER_AREA_LABELS,
  EFFECT_TRIGGER_AREA_SHIFT_KIND_LABELS,
  EFFECT_TRIGGER_ATTACK_OTHER_PARTY_LABELS,
  EFFECT_TRIGGER_CHOOSER_LABELS,
  EFFECT_TRIGGER_DAMAGE_HALF_GATE,
  EFFECT_TRIGGER_DAMAGE_HALF_LABEL,
  EFFECT_TRIGGER_GATE_LABELS,
  EFFECT_TRIGGER_MAX_HP_REST_LABELS,
  EFFECT_TRIGGER_MOVE_KIND_LABELS,
  EFFECT_TRIGGER_MOVE_ORIGIN_LABELS,
  EFFECT_TRIGGER_NORMAL_SAVE_MODE,
  EFFECT_TRIGGER_PERIOD_LABELS,
  EFFECT_TRIGGER_RECIPIENT_LABELS,
  EFFECT_TRIGGER_REST_LABELS,
  EFFECT_TRIGGER_ROLE_LABELS,
  EFFECT_TRIGGER_SAVE_MODE_LABELS,
  EFFECT_TURN_ANCHOR_LABELS,
  EFFECT_TURN_TIMING_LABELS,
  EFFECT_USE_DELIVERY_LABELS,
  EFFECT_VARIANT_PICK_LABELS,
  EFFECT_ZONE_AREA_TRIGGER_LABELS,
  SAVE_DC_AUTO_MODE,
  SAVE_DC_MANUAL_MODE,
  TRIGGER_ATTACK_KIND_PHRASES,
} from './constants';
import {
  triggerEventAcceptsApplier,
  triggerEventAcceptsArea,
  triggerEventAcceptsChoice,
  triggerEventHasOtherParty,
  triggerEventHasRole,
} from './layout';
import { TRIGGER_ATTACK_KINDS } from './triggerConditions';
import { triggerEventHasPathFeet } from './triggers';
import {
  DEFAULT_TRIGGER_ATTACK_ROLE,
  EFFECT_ACTION_COSTS,
  EFFECT_CAST_OWNERS,
  EFFECT_NOTIFY_TARGETS,
  EFFECT_RESTORE_KINDS,
  EFFECT_TEMP_HP_MODES,
  EFFECT_TRIGGER_ACTION_GATES,
  EFFECT_TRIGGER_AREA_SHIFT_KINDS,
  EFFECT_TRIGGER_ATTACK_ROLES,
  EFFECT_TRIGGER_CHOOSERS,
  EFFECT_TRIGGER_LIMIT_PERIODS,
  EFFECT_TRIGGER_MAX_HP_REST_ENDS,
  EFFECT_TRIGGER_MOVE_KINDS,
  EFFECT_TRIGGER_MOVE_ORIGINS,
  EFFECT_TRIGGER_RECIPIENTS,
  EFFECT_TRIGGER_REST_TYPES,
  EFFECT_TRIGGER_SAVE_MODES,
  PATH_AREA_SHIFT_KINDS,
} from './triggerTypes';
import {
  EFFECT_ESCAPE_ACTORS,
  EFFECT_ESCAPE_OUTCOMES,
  EFFECT_SAVE_TIMINGS,
  EFFECT_VARIANT_PICKS,
} from './types';

/** Моменты срабатывания зоны и ауры в порядке показа. */
const EFFECT_AREA_TRIGGER_ORDER: readonly EffectAreaTrigger[] = [
  'stay',
  'enter',
  'exit',
];

/** Типы длительности в порядке показа: от частых к редким. */
const EFFECT_DURATION_TYPE_ORDER: readonly EffectDurationType[] = [
  'permanent',
  'rounds',
  'turn',
  'minutes',
  'hours',
  'days',
  'special',
];

/** Моменты хода точной длительности в порядке показа. */
const EFFECT_TURN_TIMING_ORDER: readonly EffectTurnTiming[] = ['end', 'start'];

/** Якоря хода точной длительности в порядке показа. */
const EFFECT_TURN_ANCHOR_ORDER: readonly EffectTurnAnchor[] = [
  'carrier',
  'source',
];

/** Кого задевает аура — в порядке показа. */
const EFFECT_AURA_TARGET_ORDER: readonly EffectAuraTarget[] = [
  'allies',
  'enemies',
  'all',
];

/** Режимы поля Сл в порядке показа: сначала Сл источника. */
const SAVE_DC_FIELD_MODE_ORDER: readonly SaveDcFieldMode[] = [
  SAVE_DC_AUTO_MODE,
  SAVE_DC_MANUAL_MODE,
];

/** Длительности, у которых есть число единиц. */
const COUNTED_DURATION_TYPES: ReadonlySet<EffectDurationType> = new Set([
  'rounds',
  'minutes',
  'hours',
  'days',
]);

/** Вариант выбора. */
export interface EffectSegmentOption<Value extends string> {
  /** Значение варианта. */
  value: Value;
  /** Подпись. */
  label: string;
  /** Иконка. */
  icon?: string;
}

/** Вариант выбора с пояснением. */
export interface EffectDescribedOption<Value extends string> {
  /** Значение варианта. */
  value: Value;
  /** Подпись. */
  label: string;
  /** Пояснение под подписью. */
  description: string;
}

/**
 * Подпись доставки в месте формы. У применяемого эффекта свои: копия ложится
 * при применении, а не пока источник надет.
 *
 * @param delivery доставка.
 * @param context место формы.
 * @param useActivated накладывается ли эффект применением.
 * @returns подпись.
 */
function deliveryLabel(
  delivery: EffectDelivery,
  context: EffectFormContext,
  useActivated: boolean,
): string {
  switch (delivery) {
    case 'carrier':
      return useActivated
        ? EFFECT_USE_DELIVERY_LABELS.carrier
        : EFFECT_CARRIER_DELIVERY_LABELS[context];
    case 'target':
      return useActivated
        ? EFFECT_USE_DELIVERY_LABELS.target
        : EFFECT_TARGET_DELIVERY_LABELS[context];
    case 'aura':
      return EFFECT_DELIVERY_LABELS.aura;
    case 'zone':
    default:
      return context === 'spell'
        ? EFFECT_DELIVERY_LABELS.spellZone
        : EFFECT_DELIVERY_LABELS.zone;
  }
}

/**
 * Варианты «на кого» для места формы.
 *
 * @param layout раскладка формы.
 * @returns варианты в порядке раскладки.
 */
export function buildDeliveryOptions(
  layout: EffectFormLayout,
): EffectSegmentOption<EffectDelivery>[] {
  return layout.deliveryOptions.map((delivery) => ({
    value: delivery,
    label: deliveryLabel(delivery, layout.context, layout.useActivated),
    icon: EFFECT_DELIVERY_ICONS[delivery],
  }));
}

/**
 * Варианты момента срабатывания: у зоны и ауры подписи свои.
 *
 * @param delivery доставка.
 * @returns варианты.
 */
export function buildAreaTriggerOptions(
  delivery: EffectDelivery,
): EffectSegmentOption<EffectAreaTrigger>[] {
  const labels =
    delivery === 'aura'
      ? EFFECT_AURA_AREA_TRIGGER_LABELS
      : EFFECT_ZONE_AREA_TRIGGER_LABELS;

  return EFFECT_AREA_TRIGGER_ORDER.map((trigger) => ({
    value: trigger,
    label: labels[trigger],
  }));
}

/**
 * Сужает значение переключателя до момента срабатывания.
 *
 * @param value значение из переключателя.
 * @returns момент либо `undefined` для чужого значения.
 */
export function findAreaTrigger(
  value: string | number,
): EffectAreaTrigger | undefined {
  return EFFECT_AREA_TRIGGER_ORDER.find((trigger) => trigger === value);
}

/**
 * Варианты «при успехе» для раскладки.
 *
 * @param layout раскладка формы.
 * @returns варианты с пояснениями.
 */
export function buildSuccessOutcomeOptions(
  layout: EffectFormLayout,
): EffectDescribedOption<EffectSuccessOutcome>[] {
  const outcomeOptions = layout.successOutcomeForActionSave
    ? EFFECT_ACTION_SAVE_OUTCOME_OPTIONS
    : EFFECT_SUCCESS_OUTCOME_OPTIONS;

  return layout.successOutcomes.map((outcome) => ({
    value: outcome,
    ...outcomeOptions[outcome],
  }));
}

/**
 * Есть ли у длительности число единиц.
 *
 * @param durationType тип длительности.
 * @returns `true` для раундов, минут, часов и дней.
 */
export function isCountedDuration(durationType: EffectDurationType): boolean {
  return COUNTED_DURATION_TYPES.has(durationType);
}

/**
 * Пояснение под выбором длительности.
 *
 * @param durationType тип длительности.
 * @returns пояснение.
 */
export function durationHint(durationType: EffectDurationType): string {
  return EFFECT_DURATION_HINTS[durationType];
}

/** Варианты типа длительности. */
export const EFFECT_DURATION_TYPE_OPTIONS: Array<
  EffectSegmentOption<EffectDurationType>
> = EFFECT_DURATION_TYPE_ORDER.map((durationType) => ({
  value: durationType,
  label: EFFECT_DURATION_LABELS[durationType],
}));

/** Варианты момента хода точной длительности. */
export const EFFECT_TURN_TIMING_OPTIONS: Array<
  EffectSegmentOption<EffectTurnTiming>
> = EFFECT_TURN_TIMING_ORDER.map((timing) => ({
  value: timing,
  label: EFFECT_TURN_TIMING_LABELS[timing],
}));

/** Варианты якоря хода точной длительности. */
export const EFFECT_TURN_ANCHOR_OPTIONS: Array<
  EffectSegmentOption<EffectTurnAnchor>
> = EFFECT_TURN_ANCHOR_ORDER.map((anchor) => ({
  value: anchor,
  label: EFFECT_TURN_ANCHOR_LABELS[anchor],
}));

/**
 * Меняет тип длительности. Число единиц переносится между раундами, минутами,
 * часами и днями; момент и якорь хода нужны только точной длительности.
 *
 * @param duration длительность.
 * @param durationType новый тип.
 * @returns новая длительность.
 */
export function writeDurationType(
  duration: EffectDuration,
  durationType: EffectDurationType,
): EffectDuration {
  const isTurnDuration = durationType === 'turn';

  return {
    type: durationType,
    value: isCountedDuration(durationType) ? duration.value : undefined,
    turnAnchor: isTurnDuration ? duration.turnAnchor : undefined,
    turnTiming: isTurnDuration ? duration.turnTiming : undefined,
  };
}

/**
 * Варианты «Действует»: постоянно и способы применения этого места. Пусто —
 * эффект здесь только постоянный, и выбора нет.
 *
 * @param layout раскладка формы.
 * @returns варианты.
 */
export function buildActivationOptions(
  layout: EffectFormLayout,
): EffectSegmentOption<EffectActivationChoice>[] {
  if (layout.activationModes.length === 0) {
    return [];
  }

  const choices: EffectActivationChoice[] = [
    EFFECT_PERMANENT_ACTIVATION,
    ...layout.activationModes,
  ];

  return choices.map((choice) => ({
    value: choice,
    label: EFFECT_ACTIVATION_CHOICE_LABELS[choice],
  }));
}

/** Варианты способа выбора варианта эффекта. */
export const EFFECT_VARIANT_PICK_OPTIONS: Array<
  EffectSegmentOption<EffectVariantPick>
> = EFFECT_VARIANT_PICKS.map((pick) => ({
  value: pick,
  label: EFFECT_VARIANT_PICK_LABELS[pick],
}));

/** Варианты «кого задевает аура». */
export const EFFECT_AURA_TARGET_OPTIONS: Array<
  EffectSegmentOption<EffectAuraTarget>
> = EFFECT_AURA_TARGET_ORDER.map((auraTarget) => ({
  value: auraTarget,
  label: EFFECT_AURA_TARGET_LABELS[auraTarget],
}));

/**
 * Кого задевает «всем в радиусе» и отбор кандидатов выбора. Отдельный список
 * от ауры: у срабатывания есть ещё «и носителя» — соседей по сцене ядро VTTG
 * отдаёт без субъекта, и добавить его может только система.
 */
export const EFFECT_TRIGGER_AREA_TARGET_OPTIONS: Array<
  EffectSegmentOption<EffectTriggerAreaTarget>
> = [
  ...EFFECT_AURA_TARGET_OPTIONS,
  { value: 'alliesWithSelf', label: EFFECT_TRIGGER_AREA_LABELS.alliesWithSelf },
  { value: 'allWithSelf', label: EFFECT_TRIGGER_AREA_LABELS.allWithSelf },
];

/** Варианты периода шага строки модификатора. */
export const EFFECT_CHANGE_STEP_PER_OPTIONS: Array<
  EffectSegmentOption<EffectChangeStepPeriod>
> = EFFECT_CHANGE_STEP_PERIODS.map((period) => ({
  value: period,
  label: EFFECT_CHANGE_STEP_PER_LABELS[period],
}));

/** Чем платят за срабатывание или за «вырваться». */
export const EFFECT_ACTION_COST_OPTIONS: Array<
  EffectSegmentOption<EffectActionCost>
> = EFFECT_ACTION_COSTS.map((cost) => ({
  value: cost,
  label: EFFECT_ACTION_COST_LABELS[cost],
}));

/** Кому адресовано сообщение срабатывания. */
export const EFFECT_NOTIFY_TARGET_OPTIONS: Array<
  EffectSegmentOption<EffectNotifyTarget>
> = EFFECT_NOTIFY_TARGETS.map((notifyTarget) => ({
  value: notifyTarget,
  label: EFFECT_NOTIFY_TARGET_LABELS[notifyTarget],
}));

/** Как двигает действие «Переместить». */
export const EFFECT_TRIGGER_MOVE_KIND_OPTIONS: Array<
  EffectSegmentOption<EffectTriggerMoveKind>
> = EFFECT_TRIGGER_MOVE_KINDS.map((moveKind) => ({
  value: moveKind,
  label: EFFECT_TRIGGER_MOVE_KIND_LABELS[moveKind],
}));

/**
 * Как сдвигается зона. «За носителем» — только на событии пути: смещение
 * берётся у фишки носителя, на других событиях его нет.
 *
 * @param event событие срабатывания.
 * @returns виды сдвига для события.
 */
export function buildAreaShiftKindOptions(
  event: EffectTriggerEvent | undefined,
): EffectSegmentOption<EffectTriggerAreaShiftKind>[] {
  return EFFECT_TRIGGER_AREA_SHIFT_KINDS.filter(
    (shiftKind) =>
      !PATH_AREA_SHIFT_KINDS.includes(shiftKind)
      || (event !== undefined && triggerEventHasPathFeet(event)),
  ).map((shiftKind) => ({
    value: shiftKind,
    label: EFFECT_TRIGGER_AREA_SHIFT_KIND_LABELS[shiftKind],
  }));
}

/** От кого считают направление перемещения. */
export const EFFECT_TRIGGER_MOVE_ORIGIN_OPTIONS: Array<
  EffectSegmentOption<EffectTriggerMoveOrigin>
> = EFFECT_TRIGGER_MOVE_ORIGINS.map((moveOrigin) => ({
  value: moveOrigin,
  label: EFFECT_TRIGGER_MOVE_ORIGIN_LABELS[moveOrigin],
}));

/** Что делает действие с временными хитами. */
export const EFFECT_TEMP_HP_MODE_OPTIONS: Array<
  EffectSegmentOption<EffectTempHpMode>
> = EFFECT_TEMP_HP_MODES.map((tempHpMode) => ({
  value: tempHpMode,
  label: EFFECT_TEMP_HP_MODE_LABELS[tempHpMode],
}));

/** Какой ресурс возвращает действие. */
export const EFFECT_RESTORE_KIND_OPTIONS: Array<
  EffectSegmentOption<EffectRestoreKind>
> = EFFECT_RESTORE_KINDS.map((restoreKind) => ({
  value: restoreKind,
  label: EFFECT_RESTORE_KIND_LABELS[restoreKind],
}));

/** Чей каст заканчивает действие. */
export const EFFECT_CAST_OWNER_OPTIONS: Array<
  EffectSegmentOption<EffectCastOwner>
> = EFFECT_CAST_OWNERS.map((castOwner) => ({
  value: castOwner,
  label: EFFECT_CAST_OWNER_LABELS[castOwner],
}));

/** Виды атаки в условии срабатывания: подписи фразы с заглавной буквы. */
export const ATTACK_KIND_OPTIONS: Array<
  EffectSegmentOption<TriggerAttackKind>
> = TRIGGER_ATTACK_KINDS.map((attackKind) => ({
  value: attackKind,
  label: upperFirst(TRIGGER_ATTACK_KIND_PHRASES[attackKind]),
}));

/** Кто может вырваться из эффекта. */
export const EFFECT_ESCAPE_ACTOR_OPTIONS: Array<
  EffectSegmentOption<EffectEscapeActor>
> = EFFECT_ESCAPE_ACTORS.map((escapeActor) => ({
  value: escapeActor,
  label: EFFECT_ESCAPE_ACTOR_LABELS[escapeActor],
}));

/** Что даёт успех действия «вырваться». */
export const EFFECT_ESCAPE_OUTCOME_OPTIONS: Array<
  EffectSegmentOption<EffectEscapeOutcome>
> = EFFECT_ESCAPE_OUTCOMES.map((escapeOutcome) => ({
  value: escapeOutcome,
  label: EFFECT_ESCAPE_OUTCOME_LABELS[escapeOutcome],
}));

/**
 * Состояния для выбора с ключом-строкой: так их хранят подавление, снятие и
 * «когда состояние снимается» — как в системе, где состояние может быть
 * заведено в мире.
 */
export const EFFECT_CONDITION_KEY_ITEMS: Array<{
  label: string;
  value: string;
}> = EFFECT_CONDITION_OPTIONS;

/**
 * Состояния для выбора с пунктом «любое / все» первым.
 *
 * @param anyLabel подпись пункта без состояния.
 * @returns пункты состояний.
 */
export function buildConditionItemsWithAny(
  anyLabel: string,
): Array<{ label: string; value: string }> {
  return [
    { label: anyLabel, value: ANY_CONDITION_KEY },
    ...EFFECT_CONDITION_KEY_ITEMS,
  ];
}

/** Режимы поля Сл: Сл источника или своё число. */
export const SAVE_DC_FIELD_MODE_OPTIONS: Array<
  EffectSegmentOption<SaveDcFieldMode>
> = SAVE_DC_FIELD_MODE_ORDER.map((mode) => ({
  value: mode,
  label: EFFECT_SAVE_DC_FIELD_MODE_LABELS[mode],
}));

/** Исход урона в строке срабатывания: гейт либо «успех — половина». */
export type EffectTriggerDamageGateChoice =
  EffectTriggerActionGate | typeof EFFECT_TRIGGER_DAMAGE_HALF_GATE;

/** Варианты роли субъекта в броске атаки. */
export const EFFECT_TRIGGER_ROLE_OPTIONS: Array<
  EffectSegmentOption<EffectTriggerAttackRole>
> = EFFECT_TRIGGER_ATTACK_ROLES.map((attackRole) => ({
  value: attackRole,
  label: EFFECT_TRIGGER_ROLE_LABELS[attackRole],
}));

/**
 * Подпись «другой стороны» по событию: у урона — кто его нанёс, у броска атаки
 * — цель или атакующий, при наложении — кто наложил.
 *
 * @param trigger событие и роль строки.
 * @returns подпись.
 */
function resolveOtherPartyLabel(
  trigger: Pick<EffectTrigger, 'event' | 'role'>,
): string {
  if (triggerEventHasRole(trigger.event)) {
    return EFFECT_TRIGGER_ATTACK_OTHER_PARTY_LABELS[
      trigger.role ?? DEFAULT_TRIGGER_ATTACK_ROLE
    ];
  }

  return trigger.event === 'applied'
    ? EFFECT_TRIGGER_APPLIED_OTHER_PARTY_LABEL
    : EFFECT_TRIGGER_RECIPIENT_LABELS.other;
}

/** Кто выбирает получателей действий. */
export const EFFECT_TRIGGER_CHOOSER_OPTIONS: Array<
  EffectSegmentOption<EffectTriggerChooser>
> = EFFECT_TRIGGER_CHOOSERS.map((chooser) => ({
  value: chooser,
  label: EFFECT_TRIGGER_CHOOSER_LABELS[chooser],
}));

/**
 * Варианты получателя действий срабатывания. «Другая сторона» подписана по
 * событию: у урона — кто его нанёс, у броска атаки — цель или атакующий. «Всем
 * в радиусе» — только у событий, которые выполняет сервер со сценой.
 *
 * @param trigger событие и роль строки.
 * @returns варианты.
 */
export function buildTriggerRecipientOptions(
  trigger: Pick<EffectTrigger, 'event' | 'role'>,
): EffectSegmentOption<EffectTriggerRecipient>[] {
  const labels: Record<EffectTriggerRecipient, string> = {
    ...EFFECT_TRIGGER_RECIPIENT_LABELS,
    other: resolveOtherPartyLabel(trigger),
  };

  const available: Record<EffectTriggerRecipient, boolean> = {
    subject: true,
    other: triggerEventHasOtherParty(trigger.event),
    source: triggerEventAcceptsApplier(trigger.event),
    area: triggerEventAcceptsArea(trigger.event),
    choice: triggerEventAcceptsChoice(trigger.event),
  };

  return EFFECT_TRIGGER_RECIPIENTS.filter(
    (recipient) => available[recipient],
  ).map((recipient) => ({
    value: recipient,
    label: labels[recipient],
  }));
}

/**
 * Выбирается ли у события получатель действий: другая сторона или «всем в
 * радиусе».
 *
 * @param event событие срабатывания.
 * @returns `true`, если выбор получателя есть.
 */
export function triggerEventHasRecipientChoice(
  event: EffectTrigger['event'],
): boolean {
  return (
    triggerEventHasOtherParty(event)
    || triggerEventAcceptsArea(event)
    || triggerEventAcceptsChoice(event)
  );
}

/** Варианты отдыха срабатывания «После отдыха». */
export const EFFECT_TRIGGER_REST_OPTIONS: Array<
  EffectSegmentOption<EffectTriggerRestType>
> = EFFECT_TRIGGER_REST_TYPES.map((restType) => ({
  value: restType,
  label: EFFECT_TRIGGER_REST_LABELS[restType],
}));

/** После какого отдыха возвращается максимум хитов. */
export const EFFECT_TRIGGER_MAX_HP_REST_OPTIONS: Array<
  EffectSegmentOption<EffectTriggerMaxHpRestEnd>
> = EFFECT_TRIGGER_MAX_HP_REST_ENDS.map((restType) => ({
  value: restType,
  label: EFFECT_TRIGGER_MAX_HP_REST_LABELS[restType],
}));

/** Выбор режима спасброска срабатывания. */
export type EffectTriggerSaveModeChoice =
  EffectTriggerSaveMode | typeof EFFECT_TRIGGER_NORMAL_SAVE_MODE;

/** Режимы спасброска по порядку: обычный первым. */
const SAVE_MODE_CHOICES: readonly EffectTriggerSaveModeChoice[] = [
  EFFECT_TRIGGER_NORMAL_SAVE_MODE,
  ...EFFECT_TRIGGER_SAVE_MODES,
];

/** Варианты режима спасброска срабатывания. */
export const EFFECT_TRIGGER_SAVE_MODE_OPTIONS: Array<
  EffectSegmentOption<EffectTriggerSaveModeChoice>
> = SAVE_MODE_CHOICES.map((saveMode) => ({
  value: saveMode,
  label: EFFECT_TRIGGER_SAVE_MODE_LABELS[saveMode],
}));

/** Варианты момента повторного спасброска. */
export const EFFECT_SAVE_TIMING_OPTIONS: Array<
  EffectSegmentOption<EffectSaveTiming>
> = EFFECT_SAVE_TIMINGS.map((timing) => ({
  value: timing,
  label: EFFECT_SAVE_TIMING_LABELS[timing],
}));

/** Варианты периода лимита. */
export const EFFECT_TRIGGER_PERIOD_OPTIONS: Array<
  EffectSegmentOption<EffectTriggerLimitPeriod>
> = EFFECT_TRIGGER_LIMIT_PERIODS.map((period) => ({
  value: period,
  label: EFFECT_TRIGGER_PERIOD_LABELS[period],
}));

/** Варианты исхода действия относительно спасброска. */
export const EFFECT_TRIGGER_GATE_OPTIONS: Array<
  EffectSegmentOption<EffectTriggerActionGate>
> = EFFECT_TRIGGER_ACTION_GATES.map((gate) => ({
  value: gate,
  label: EFFECT_TRIGGER_GATE_LABELS[gate],
}));

/** Варианты исхода урона: «успех — половина» — отдельный вариант. */
export const EFFECT_TRIGGER_DAMAGE_GATE_OPTIONS: Array<
  EffectSegmentOption<EffectTriggerDamageGateChoice>
> = [
  { value: 'failed', label: EFFECT_TRIGGER_GATE_LABELS.failed },
  {
    value: EFFECT_TRIGGER_DAMAGE_HALF_GATE,
    label: EFFECT_TRIGGER_DAMAGE_HALF_LABEL,
  },
  { value: 'always', label: EFFECT_TRIGGER_GATE_LABELS.always },
  { value: 'saved', label: EFFECT_TRIGGER_GATE_LABELS.saved },
];

/**
 * Параметры части условия, значение которых выбирается списком. Ключ отметки
 * и название вида вводятся строкой, число — полем: у них вариантов нет.
 */
export type TriggerConditionListParameter = Exclude<
  TriggerConditionParameter,
  'tag' | 'number' | 'text'
>;

/**
 * Варианты значения части условия по тому, что выбирается: тип урона, тип
 * существа, размер, состояние, характеристика или вид атаки.
 */
export const EFFECT_TRIGGER_CONDITION_VALUE_OPTIONS: Record<
  TriggerConditionListParameter,
  Array<{ label: string; value: string }>
> = {
  damageType: EFFECT_DAMAGE_TYPE_OPTIONS,
  creatureType: EFFECT_CREATURE_CATEGORY_OPTIONS,
  size: EFFECT_CREATURE_SIZE_OPTIONS,
  condition: EFFECT_CONDITION_OPTIONS,
  ability: EFFECT_ABILITY_OPTIONS,
  attackKind: ATTACK_KIND_OPTIONS,
};
