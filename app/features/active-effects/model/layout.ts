/**
 * Раскладка формы эффекта: какие шаги показывать там, откуда форма открыта.
 *
 * Один и тот же `ActiveEffect` живёт в разных местах — в черте, в предмете, в
 * оружии, в заклинании, в действии существа, — и в каждом месте работает своё
 * подмножество полей. Форма, показывающая все поля везде, и была причиной
 * путаницы: спасбросок на пассивной черте, длительность на кольце, «цель» у
 * черты существа молча ничего не делали. Здесь, по месту и текущим настройкам
 * эффекта, решается, что имеет смысл, — чистыми функциями, которые проверяет
 * тест.
 *
 * Зеркало: dnd5-test-migrate/src/engine/effectFormLayout.ts — правила сверены
 * там с рантаймом VTTG, сюда перенесены 1:1 с теми же именами.
 */

import type {
  EffectTrigger,
  EffectTriggerAction,
  EffectTriggerChoice,
  EffectTriggerEvent,
  EffectTriggerSave,
  EffectTriggerTurnOwner,
  NestedEffectTrigger,
} from './triggerTypes';
import type {
  ActiveEffect,
  EffectAbility,
  EffectActivation,
  EffectActivationMode,
  EffectAreaTrigger,
  EffectAura,
  EffectCharges,
  EffectEscape,
  EffectOrigin,
  EffectSave,
  EffectSaveOutcome,
} from './types';

import { hasLastingEffectPayload } from './automation';
import { EFFECT_TRIGGER_CONDITION_DEFAULT_VALUES } from './constants';
import { applyEffectStage, resolveEffectStageIndex } from './stages';
import { writeTriggerCondition } from './triggerConditions';
import {
  createEffectTriggerId,
  listEffectListTriggers,
  writeEffectTriggers,
} from './triggers';
import {
  APPLIER_TRIGGER_RECIPIENT,
  AREA_RECIPIENT_TRIGGER_EVENTS,
  AREA_TRIGGER_RECIPIENT,
  CHOICE_RECIPIENT_TRIGGER_EVENTS,
  CHOICE_TRIGGER_RECIPIENT,
  CONDITION_LOST_TRIGGER_EVENTS,
  DAMAGE_DATA_TRIGGER_EVENTS,
  DAMAGE_TRIGGER_EVENTS,
  DEFAULT_EFFECT_TAG,
  DEFAULT_TRIGGER_AREA_RADIUS,
  DEFAULT_TRIGGER_ATTACK_ROLE,
  DEFAULT_TRIGGER_CHOICE_COUNT,
  DEFAULT_TRIGGER_CHOICE_RADIUS,
  EFFECT_TRIGGER_TURN_OWNERS,
  HEALING_TRIGGER_EVENTS,
  isEffectTag,
  MAX_TRIGGER_CHOICE_COUNT,
  MIN_TRIGGER_LIMIT_MAX,
  MOVEMENT_TRIGGER_EVENTS,
  NESTED_TRIGGER_EVENTS,
  OTHER_PARTY_TRIGGER_EVENTS,
  OWN_DEED_TRIGGER_EVENTS,
  PRESENCE_TRIGGER_EVENTS,
  TURN_TRIGGER_EVENTS,
} from './triggerTypes';
import {
  DEFAULT_ACTIVATION_AMOUNT,
  DEFAULT_EFFECT_CHANGE_PRIORITY,
  EFFECT_ACTIVATION_MODES,
  EFFECT_ORIGIN,
  isUseActivatedEffect,
  MAX_EFFECT_CHARGES,
  MIN_EFFECT_CHARGES,
  parseFormNumber,
} from './types';

/** Места, откуда открывается форма эффекта. */
export const EFFECT_FORM_CONTEXTS = [
  'ownEffects',
  'feature',
  'item',
  'weapon',
  'spell',
  'creatureAction',
  'creatureTrait',
  'zone',
  'condition',
  'generic',
] as const;

/**
 * Место, откуда открыта форма эффекта:
 * - `ownEffects` — свои эффекты персонажа или существа;
 * - `feature` — черта, предыстория, класс, вид (эффект копируется на персонажа,
 *   аура умения — «Аура защиты» паладина — излучается уже с него);
 * - `item` — снаряжение и инструменты (действует, пока надето);
 * - `weapon` — оружие: на владельце или на цели при попадании;
 * - `spell` — заклинание: на цели, на заклинателе, аурой или зоной на месте
 *   шаблона;
 * - `creatureAction` — действие существа (на цели);
 * - `creatureTrait` — черта существа (на самом существе);
 * - `zone` — зона на сцене VTTG (у сайта такого места нет);
 * - `condition` — запись состояния мира VTTG (у сайта такого места нет);
 * - `generic` — место неизвестно: видно всё (сайт его не передаёт).
 */
export type EffectFormContext = (typeof EFFECT_FORM_CONTEXTS)[number];

/** Места формы по имени: редакторы передают их вместо строк. */
export const EFFECT_FORM_CONTEXT = {
  ownEffects: 'ownEffects',
  feature: 'feature',
  item: 'item',
  weapon: 'weapon',
  spell: 'spell',
  creatureAction: 'creatureAction',
  creatureTrait: 'creatureTrait',
  zone: 'zone',
  condition: 'condition',
  generic: 'generic',
} as const satisfies Record<EffectFormContext, EffectFormContext>;

/** Место эффектов предмета: оружие или прочее снаряжение. */
export type ItemEffectContext = Extract<EffectFormContext, 'item' | 'weapon'>;

/** Куда эффект доставляется. */
export type EffectDelivery = 'carrier' | 'aura' | 'target' | 'zone';

/**
 * Что происходит при УСПЕШНОМ спасброске — одна настройка вместо трёх полей
 * (`applySave.onSuccess`, `applyOnSuccess`, `applyOnSuccessOnly`).
 */
export const EFFECT_SUCCESS_OUTCOMES = [
  'nothing',
  'halfDamage',
  'halfDamageWithEffect',
  'effectWithoutDamage',
  'onlyOnSuccess',
] as const;

/** Исход успешного спасброска. */
export type EffectSuccessOutcome = (typeof EFFECT_SUCCESS_OUTCOMES)[number];

/** Почему спасбросок в текущей настройке недоступен. */
export type EffectSaveUnavailableReason = 'stayTrigger' | 'onCarrier';

/** Поля, которые в месте формы ничего не делают. */
export type InertEffectField =
  | 'activation'
  | 'landingCondition'
  | 'variant'
  | 'effectTarget'
  | 'aura'
  | 'areaTrigger'
  | 'applySave'
  | 'successOutcome'
  | 'damageParts'
  | 'recurringDamage'
  | 'recurringSave'
  | 'consumeOn'
  | 'duration'
  | 'conditionImmunities'
  | 'charges'
  | 'triggers';

/** Вид действия срабатывания. */
export type EffectTriggerActionType = EffectTriggerAction['type'];

/** Что ещё, кроме места, влияет на раскладку. */
export interface EffectFormLayoutOptions {
  /**
   * Есть ли у заклинания область: без неё зоне на месте шаблона взяться неоткуда.
   * Не задано — считается, что есть (форма без этого знания доставку не прячет).
   */
  zoneAvailable?: boolean;
}

/** Раскладка формы эффекта для текущего места и настройки. */
export interface EffectFormLayout {
  /** Место формы. */
  context: EffectFormContext;
  /** Текущая доставка эффекта. */
  delivery: EffectDelivery;
  /** Текущий момент срабатывания зоны или ауры. */
  trigger: EffectAreaTrigger;
  /** Доступные доставки; одна — выбора нет. */
  deliveryOptions: readonly EffectDelivery[];
  /** Выбор «пока внутри / при входе / при выходе». */
  showTrigger: boolean;
  /** Радиус и цели ауры. */
  showAuraSettings: boolean;
  /** Спасбросок эффекта. */
  showSave: boolean;
  /** Почему спасбросок недоступен (шаг показывается с подсказкой). */
  saveUnavailableReason: EffectSaveUnavailableReason | null;
  /** Варианты «при успехе»; пусто — выбор не показывается. */
  successOutcomes: readonly EffectSuccessOutcome[];
  /** Выбор «при успехе» относится к спасброску действия, а не эффекта. */
  successOutcomeForActionSave: boolean;
  /** Урон срабатывания. */
  showTriggerDamage: boolean;
  /** Урон каждый ход. */
  showRecurringDamage: boolean;
  /** Кнопка «Шаблон состояния». */
  showConditionPreset: boolean;
  /** Иммунитеты к состояниям. */
  showConditionImmunities: boolean;
  /** Длительность. */
  showDuration: boolean;
  /** Повторный спасбросок хода. */
  showRecurringSave: boolean;
  /** Снятие после атаки. */
  showConsumeOn: boolean;
  /**
   * События, на которые здесь работают срабатывания списка «Срабатывания»;
   * пусто — шага нет.
   */
  triggerEvents: readonly EffectTriggerEvent[];
  /** Действия срабатываний списка, которые здесь работают. */
  triggerActions: readonly EffectTriggerActionType[];
  /**
   * Чей ход выбирается у срабатываний начала и конца хода; один вариант —
   * выбора нет.
   */
  triggerTurnOwners: readonly EffectTriggerTurnOwner[];
  /**
   * Способы применения и включения, которые здесь работают; пусто — эффект
   * здесь действует только постоянно.
   */
  activationModes: readonly EffectActivationMode[];
  /** Применение или включение тратит счётчик листа. */
  showActivationCounter: boolean;
  /** Эффект накладывается применением: доставки подписаны «при применении». */
  useActivated: boolean;
  /**
   * Переключатель «Работает» в шапке. У шаблона применения его нет: на листе
   * такой шаблон всегда лежит выключенным.
   */
  showStatusToggle: boolean;
  /**
   * Ступени эффекта: каждая со своими модификаторами и флагами. Есть смысл
   * там, где эффект лежит на существе и живёт своей жизнью.
   */
  showStages: boolean;
  /**
   * Действие, снимающее эффект («вырваться»). Есть смысл там же, где ступени:
   * снимать нечего у эффекта, который на существе не лежит.
   */
  showEscape: boolean;
  /**
   * Заряды эффекта. Есть смысл там, где у эффекта вообще бывают срабатывания
   * и он ложится экземпляром на существо: заряд списывают из самого эффекта.
   */
  showCharges: boolean;
  /** Условие наложения «Ложится, если». */
  showLandingCondition: boolean;
  /** Выбор «Один из вариантов». */
  showVariant: boolean;
  /** Минимальная Сл спасброска (0 — «Сл источника»). */
  minSaveDc: number;
  /** Есть где появиться зоне на месте шаблона (у заклинания есть область). */
  zoneAvailable: boolean;
}

/** Доставки по месту формы: первая — доставка нового эффекта. */
const CONTEXT_DELIVERIES: Record<EffectFormContext, readonly EffectDelivery[]> =
  {
    ownEffects: ['carrier', 'aura'],
    feature: ['carrier', 'aura'],
    item: ['carrier', 'aura'],
    weapon: ['carrier', 'target', 'aura'],
    spell: ['target', 'carrier', 'aura', 'zone'],
    creatureAction: ['target', 'carrier'],
    creatureTrait: ['carrier', 'aura'],
    zone: ['zone'],
    condition: ['carrier'],
    generic: ['carrier', 'target', 'aura'],
  };

/**
 * Доставки эффекта, который накладывается применением: копия ложится на
 * применившего (в том числе аурой) либо на выбранную цель.
 */
const USE_DELIVERIES: readonly EffectDelivery[] = ['carrier', 'target', 'aura'];

/**
 * Способы применения и включения по месту формы. Предмет применяют (зелье,
 * стрела) — включать его нечем, он работает, пока надет. Эффект листа и умения
 * применяют кнопкой или включают переключателем.
 */
const CONTEXT_ACTIVATION_MODES: Partial<
  Record<EffectFormContext, readonly EffectActivationMode[]>
> = {
  ownEffects: EFFECT_ACTIVATION_MODES,
  feature: EFFECT_ACTIVATION_MODES,
  item: ['use'],
  generic: EFFECT_ACTIVATION_MODES,
};

/** Места, где применение и включение тратят счётчик листа, а не заряды. */
const ACTIVATION_COUNTER_CONTEXTS: ReadonlySet<EffectFormContext> = new Set([
  'ownEffects',
  'feature',
  'generic',
]);

/**
 * Места, где эффект «на носителе» кладёт каст: условие наложения проверяется
 * на заклинателе.
 */
const LANDING_CARRIER_CONTEXTS: ReadonlySet<EffectFormContext> = new Set([
  'spell',
  'creatureAction',
]);

/**
 * Места, где эффекты — часть одного каста или действия и могут быть
 * альтернативами: выбор делается при броске.
 */
const VARIANT_CONTEXTS: ReadonlySet<EffectFormContext> = new Set([
  'spell',
  'weapon',
  'creatureAction',
]);

/**
 * Места, где эффект «на носителе» лежит в `activeEffects` и проживает свою
 * жизнь: тикает длительность, бросается повторный спасбросок, снимается после
 * атаки. У предмета и черты эффект вложен в запись и этого не делает, а у
 * выданной черты повторный спасбросок и снятие удалили бы саму черту.
 */
const LIVING_CARRIER_CONTEXTS: ReadonlySet<EffectFormContext> = new Set([
  'ownEffects',
  'spell',
  'creatureAction',
]);

/**
 * Места, где эффект «на носителе» не лежит в `activeEffects`, но срабатывания
 * хода у него работают: черта существа лечит и бьёт на его ходу
 * («Регенерация»). Снять саму черту срабатывание не может.
 */
const TICKING_CARRIER_CONTEXTS: ReadonlySet<EffectFormContext> = new Set([
  'creatureTrait',
]);

/**
 * Места, где эффект на носителе слышит урон по нему: лежит на существе, на
 * работающем предмете или в черте статблока.
 */
const DAMAGE_EVENT_CONTEXTS: ReadonlySet<EffectFormContext> = new Set([
  'ownEffects',
  'spell',
  'feature',
  'item',
  'creatureTrait',
]);

/**
 * Места со спасброском самого действия — к нему относится выбор «при успехе»,
 * если у эффекта своего спасброска нет.
 */
const ACTION_SAVE_CONTEXTS: ReadonlySet<EffectFormContext> = new Set([
  'spell',
  'creatureAction',
]);

/** Аура нового эффекта по умолчанию. */
export const DEFAULT_EFFECT_AURA: EffectAura = {
  radius: 10,
  target: 'allies',
  applyToSelf: true,
  visible: true,
};

/** Сложность спасброска нового эффекта по умолчанию. */
export const DEFAULT_EFFECT_SAVE_DC = 13;

/** Характеристика спасброска нового эффекта по умолчанию. */
export const DEFAULT_EFFECT_SAVE_ABILITY: EffectAbility = 'wisdom';

/** Минимальная Сл, когда подставить Сл источника нечем. */
export const FIXED_MIN_SAVE_DC = 1;

/** Сл в данных, которая значит «Сл источника» (поле показывает «Авто»). */
export const APPLIER_SAVE_DC = 0;

/** Минимальная Сл, когда 0 значит «Сл источника». */
const APPLIER_MIN_SAVE_DC = APPLIER_SAVE_DC;

/** Хиты нового действия «Хиты становятся»: «вместо 0 хитов — 1 хит». */
export const DEFAULT_SET_HP_VALUE = 1;

/**
 * Доставка эффекта, как её видит форма в этом месте.
 *
 * @param effect эффект.
 * @param context место формы.
 * @returns доставка.
 */
export function readEffectDelivery(
  effect: ActiveEffect,
  context: EffectFormContext,
): EffectDelivery {
  const contextDeliveries = resolveContextDeliveries(effect, context);

  // Зона мастера — единственная доставка своего места; у заклинания зона лишь
  // одна из доставок, и её выбирает поле эффекта
  if (
    (contextDeliveries.length === 1 && contextDeliveries[0] === 'zone')
    || (effect.effectTarget === 'zone' && contextDeliveries.includes('zone'))
  ) {
    return 'zone';
  }

  if (effect.aura && contextDeliveries.includes('aura')) {
    return 'aura';
  }

  if (
    effect.effectTarget === 'target'
    && contextDeliveries.includes('target')
  ) {
    return 'target';
  }

  return contextDeliveries.includes('carrier')
    ? 'carrier'
    : (contextDeliveries[0] ?? 'carrier');
}

/**
 * Меняет доставку эффекта. Аура и цель атаки взаимоисключающие: аура
 * излучается носителем, а эффект «на цели» ложится на того, по кому попали.
 *
 * @param effect эффект.
 * @param delivery новая доставка.
 * @returns новый эффект.
 */
export function writeEffectDelivery(
  effect: ActiveEffect,
  delivery: EffectDelivery,
): ActiveEffect {
  switch (delivery) {
    case 'aura':
      return {
        ...effect,
        effectTarget: 'self',
        aura: effect.aura ?? { ...DEFAULT_EFFECT_AURA },
      };
    case 'target':
      return {
        ...effect,
        effectTarget: 'target',
        aura: undefined,
        areaTrigger: undefined,
      };
    case 'zone':
      return { ...effect, effectTarget: 'zone', aura: undefined };
    case 'carrier':
    default:
      return {
        ...effect,
        effectTarget: 'self',
        aura: undefined,
        areaTrigger: undefined,
      };
  }
}

/**
 * Момент срабатывания зоны или ауры; без поля — «пока внутри».
 *
 * @param effect эффект.
 * @returns момент срабатывания.
 */
export function readEffectAreaTrigger(effect: ActiveEffect): EffectAreaTrigger {
  return effect.areaTrigger ?? 'stay';
}

/**
 * Меняет момент срабатывания. «Пока внутри» — поведение по умолчанию, поле для
 * него не хранится.
 *
 * @param effect эффект.
 * @param trigger новый момент.
 * @returns новый эффект.
 */
export function writeEffectAreaTrigger(
  effect: ActiveEffect,
  trigger: EffectAreaTrigger,
): ActiveEffect {
  return { ...effect, areaTrigger: trigger === 'stay' ? undefined : trigger };
}

/**
 * Новый эффект для места формы: доставка по умолчанию уже выбрана.
 *
 * @param context место формы.
 * @param id идентификатор нового эффекта.
 * @param name название по умолчанию.
 * @param origin чем эффект выдан; без него — заведён вручную.
 * @returns новый эффект.
 */
export function createEffectForContext(
  context: EffectFormContext,
  id: string,
  name: string,
  origin: EffectOrigin = EFFECT_ORIGIN.manual,
): ActiveEffect {
  const effect: ActiveEffect = {
    id,
    name,
    description: '',
    disabled: false,
    origin,
    transfer: false,
    duration: { type: 'permanent' },
    changes: [],
    flags: [],
  };

  return writeEffectDelivery(
    effect,
    CONTEXT_DELIVERIES[context][0] ?? 'carrier',
  );
}

/**
 * Исход успешного спасброска по полям эффекта.
 *
 * @param effect эффект.
 * @returns исход.
 */
export function readEffectSuccessOutcome(
  effect: ActiveEffect,
): EffectSuccessOutcome {
  if (effect.applyOnSuccessOnly) {
    return 'onlyOnSuccess';
  }

  const halfDamage = effect.applySave?.onSuccess === 'half';

  if (effect.applyOnSuccess) {
    return halfDamage ? 'halfDamageWithEffect' : 'effectWithoutDamage';
  }

  return halfDamage ? 'halfDamage' : 'nothing';
}

/**
 * Записывает исход успешного спасброска в поля эффекта.
 *
 * @param effect эффект.
 * @param outcome исход.
 * @returns новый эффект.
 */
export function writeEffectSuccessOutcome(
  effect: ActiveEffect,
  outcome: EffectSuccessOutcome,
): ActiveEffect {
  const onSuccess: EffectSaveOutcome =
    outcome === 'halfDamage' || outcome === 'halfDamageWithEffect'
      ? 'half'
      : 'negate';

  const effectAnyway =
    outcome === 'halfDamageWithEffect' || outcome === 'effectWithoutDamage';

  return {
    ...effect,
    applySave: effect.applySave
      ? { ...effect.applySave, onSuccess }
      : undefined,
    applyOnSuccess: effectAnyway ? true : undefined,
    applyOnSuccessOnly: outcome === 'onlyOnSuccess' ? true : undefined,
  };
}

/**
 * Варианты «при успехе», осмысленные для настройки эффекта. Половина урона —
 * только при уроне срабатывания, наложение при успехе — только если есть что
 * накладывать. Текущий исход остаётся в списке, даже если стал неуместен: иначе
 * выбор показал бы не то, что записано.
 *
 * @param effect эффект.
 * @param forActionSave выбор относится к спасброску действия.
 * @returns варианты в порядке показа.
 */
function listSuccessOutcomes(
  effect: ActiveEffect,
  forActionSave: boolean,
): EffectSuccessOutcome[] {
  const hasDamage = !forActionSave && (effect.damageParts?.length ?? 0) > 0;
  const hasPayload = hasLastingEffectPayload(effect);
  const currentOutcome = readEffectSuccessOutcome(effect);

  return EFFECT_SUCCESS_OUTCOMES.filter((outcome) => {
    if (outcome === currentOutcome || outcome === 'nothing') {
      return true;
    }

    switch (outcome) {
      case 'halfDamage':
        return hasDamage;
      case 'halfDamageWithEffect':
        return hasDamage && hasPayload;
      default:
        return hasPayload;
    }
  });
}

/**
 * Способы применения и включения эффекта в месте формы.
 *
 * @param context место формы.
 * @returns способы; пусто — эффект здесь только постоянный.
 */
export function listEffectActivationModes(
  context: EffectFormContext,
): readonly EffectActivationMode[] {
  return CONTEXT_ACTIVATION_MODES[context] ?? [];
}

/**
 * Накладывается ли эффект в этом месте применением.
 *
 * @param effect эффект.
 * @param context место формы.
 * @returns `true`, если применение здесь работает и выбрано.
 */
function isUsedInContext(
  effect: ActiveEffect,
  context: EffectFormContext,
): boolean {
  return (
    isUseActivatedEffect(effect)
    && listEffectActivationModes(context).includes('use')
  );
}

/**
 * Доставки эффекта в месте формы: у применяемого — свои.
 *
 * @param effect эффект.
 * @param context место формы.
 * @returns доставки; первая — доставка нового эффекта.
 */
function resolveContextDeliveries(
  effect: ActiveEffect,
  context: EffectFormContext,
): readonly EffectDelivery[] {
  return isUsedInContext(effect, context)
    ? USE_DELIVERIES
    : CONTEXT_DELIVERIES[context];
}

/**
 * Применение или включение для записи: пустой счётчик не пишется, расход — от
 * единицы, а без счётчика расход не нужен.
 *
 * @param activation применение из черновика.
 * @returns применение либо `undefined`.
 */
function normalizeDraftActivation(
  activation: EffectActivation | undefined,
): EffectActivation | undefined {
  if (!activation) {
    return undefined;
  }

  const counter = activation.counter?.trim() || undefined;

  const amount = Math.trunc(
    parseFormNumber(activation.amount) ?? DEFAULT_ACTIVATION_AMOUNT,
  );

  return {
    mode: activation.mode,
    counter,
    amount: counter && amount > DEFAULT_ACTIVATION_AMOUNT ? amount : undefined,
  };
}

/**
 * Раскладка формы эффекта: что показывать для места и текущей настройки.
 *
 * @param context место формы.
 * @param effect эффект в форме.
 * @param layoutOptions что ещё влияет на раскладку.
 * @returns раскладка.
 */
export function resolveEffectFormLayout(
  context: EffectFormContext,
  effect: ActiveEffect,
  layoutOptions: EffectFormLayoutOptions = {},
): EffectFormLayout {
  const delivery = readEffectDelivery(effect, context);

  // Без области у заклинания зоне негде появиться: такой доставки не
  // предлагаем, а уже выбранная остаётся видна — её покажет плашка
  const contextDeliveries = resolveContextDeliveries(effect, context);

  const deliveryOptions =
    layoutOptions.zoneAvailable === false
    && context !== 'zone'
    && delivery !== 'zone'
      ? contextDeliveries.filter((option) => option !== 'zone')
      : contextDeliveries;

  const trigger = readEffectAreaTrigger(effect);
  const isGeneric = context === 'generic';

  const hasTrigger = delivery === 'zone' || delivery === 'aura';
  const isOneShot = hasTrigger && trigger !== 'stay';
  const isOnTarget = delivery === 'target';
  const isAuraStay = delivery === 'aura' && trigger === 'stay';
  const activationModes = listEffectActivationModes(context);

  // Применённая копия ложится на применившего или цель и живёт своей жизнью
  const isUsed = isUsedInContext(effect, context);

  const isToggled =
    effect.activation?.mode === 'toggle' && activationModes.includes('toggle');

  const livesOnCarrier = LIVING_CARRIER_CONTEXTS.has(context) || isUsed;

  const isLivingCarrier = delivery === 'carrier' && livesOnCarrier;

  const isTickingCarrier =
    delivery === 'carrier' && TICKING_CARRIER_CONTEXTS.has(context);

  // Спасбросок эффекта бросает тот, на кого эффект ложится в момент
  // срабатывания: цель попадания или вошедший в зону/ауру
  const showSave = isGeneric || isOnTarget || isOneShot;

  let saveUnavailableReason: EffectSaveUnavailableReason | null = null;

  if (!showSave && hasTrigger) {
    saveUnavailableReason = 'stayTrigger';
  } else if (!showSave && deliveryOptions.includes('target')) {
    saveUnavailableReason = 'onCarrier';
  }

  const successOutcomeForActionSave =
    !effect.applySave && isOnTarget && ACTION_SAVE_CONTEXTS.has(context);

  const successOutcomes =
    (showSave && effect.applySave) || successOutcomeForActionSave
      ? listSuccessOutcomes(effect, successOutcomeForActionSave)
      : [];

  // Длящаяся копия на цели, на вошедшем в зону или ауру, на живом носителе
  const livesOnItsOwn = isGeneric || isOnTarget || isOneShot || isLivingCarrier;

  // Урон каждый ход тикает и у эффекта «пока в зоне» (копия лежит на
  // сущности), и у ауры «пока в ауре» — на ходу того, кого она накрыла, и у
  // черты существа — на его ходу
  const showRecurringDamage =
    livesOnItsOwn || (trigger === 'stay' && hasTrigger) || isTickingCarrier;

  const triggerList = resolveTriggerListLayout({
    showRecurringDamage,
    canRemoveSelf: livesOnItsOwn,
    hasPresence: hasTrigger,
    // Эффект на цели лежит на ней и слышит урон по ней, как свой
    hearsDamage:
      (delivery === 'carrier' && DAMAGE_EVENT_CONTEXTS.has(context))
      || isAuraStay
      || isOnTarget,
    hasApplier: !isTickingCarrier,
    endsWithCast: context === 'spell' && livesOnItsOwn,
    // Применённая копия тоже «ложится»: зелье лечит при наложении
    landsOnTarget: isOnTarget || isUsed,
    switchesOn: isToggled,
    // Действующее заклинание на существе несёт свою кнопку действия: «пока
    // заклинание действует, действием можешь…»
    hasActiveAction: context === 'spell' && livesOnItsOwn,
    hasStages: livesOnItsOwn,
  });

  return {
    context,
    delivery,
    trigger,
    deliveryOptions,
    showTrigger: hasTrigger,
    showAuraSettings: delivery === 'aura',
    showSave,
    saveUnavailableReason,
    successOutcomes,
    successOutcomeForActionSave,
    showTriggerDamage: showSave,
    showRecurringDamage,
    showConditionPreset: context !== 'condition',
    // Иммунитет ауры «пока в ауре» получают все, кого она накрывает
    // («Аура отваги»)
    showConditionImmunities: true,
    // Длительность самой ауры на живом носителе тоже тикает, а включённый
    // эффект живёт до выключения
    showDuration: livesOnItsOwn || (isAuraStay && livesOnCarrier) || isToggled,
    showRecurringSave: livesOnItsOwn,
    showConsumeOn: livesOnItsOwn,
    ...triggerList,
    showLandingCondition:
      isGeneric
      || isOnTarget
      || isOneShot
      || isUsed
      || (delivery === 'carrier' && LANDING_CARRIER_CONTEXTS.has(context)),
    showVariant: isGeneric || isUsed || VARIANT_CONTEXTS.has(context),
    activationModes,
    showActivationCounter:
      effect.activation !== undefined
      && ACTIVATION_COUNTER_CONTEXTS.has(context),
    useActivated: isUsed,
    showStatusToggle: !(isUsed && ACTIVATION_COUNTER_CONTEXTS.has(context)),
    showStages: livesOnItsOwn,
    // Вырваться можно из того, что лежит на существе: черту и зону не снять
    showEscape: livesOnItsOwn,
    // Заряд списывают из экземпляра эффекта, и списывать его должно чему:
    // срабатывания в этом месте обязаны работать
    showCharges: livesOnItsOwn && triggerList.triggerEvents.length > 0,
    minSaveDc: acceptsApplierSaveDc(context, delivery, isUsed)
      ? APPLIER_MIN_SAVE_DC
      : FIXED_MIN_SAVE_DC,
    zoneAvailable: layoutOptions.zoneAvailable !== false,
  };
}

/** Только ход носителя. */
const TURN_OWNERS_SUBJECT: readonly EffectTriggerTurnOwner[] = ['subject'];

/** Что известно о месте формы для списка «Срабатывания». */
interface TriggerListPlace {
  /** Эффект тикает на ходу существа. */
  showRecurringDamage: boolean;
  /** Эффект лежит на существе сам. */
  canRemoveSelf: boolean;
  /** Эффект заклинания лежит на существе и уходит с кастом. */
  endsWithCast: boolean;
  /** Эффект ложится ударом, заклинанием или применением. */
  landsOnTarget: boolean;
  /** Эффект включают переключателем. */
  switchesOn: boolean;
  /** Эффект зоны или ауры: в него входят и выходят. */
  hasPresence: boolean;
  /** Эффект слышит урон по носителю. */
  hearsDamage: boolean;
  /** У эффекта бывает наложивший. */
  hasApplier: boolean;
  /**
   * У действующего эффекта бывает своя кнопка действия («действием можешь
   * переместить сферу»).
   */
  hasActiveAction: boolean;
  /** У эффекта бывают ступени. */
  hasStages: boolean;
}

/**
 * Что умеет список «Срабатывания» в месте формы. Ход — там, где эффект тикает
 * на существе, вход и выход — у зоны и ауры, бросок атаки — у эффекта, лежащего
 * на существе. Снять эффект можно только лежащий на существе: черту, ауру
 * чужого токена и зону срабатывание не снимает.
 *
 * Ход наложившего выбирается у эффекта, который кто-то накладывает; у черты
 * существа наложившего нет.
 *
 * @param place что известно о месте.
 * @returns события, действия и выбор хода списка.
 */
function resolveTriggerListLayout(
  place: TriggerListPlace,
): Pick<
  EffectFormLayout,
  'triggerEvents' | 'triggerActions' | 'triggerTurnOwners'
> {
  const ticks = place.showRecurringDamage || place.canRemoveSelf;

  const triggerEvents: EffectTriggerEvent[] = [
    ...(place.landsOnTarget ? (['applied'] as const) : []),
    ...(place.switchesOn || place.hasActiveAction
      ? (['activate'] as const)
      : []),
    ...(ticks ? TURN_TRIGGER_EVENTS : []),
    ...(place.hasPresence ? PRESENCE_TRIGGER_EVENTS : []),
    ...(place.canRemoveSelf ? (['attackRoll'] as const) : []),
    ...(place.hearsDamage ? DAMAGE_TRIGGER_EVENTS : []),
    // Лечат того, у кого меняются хиты, — там же, где слышен урон
    ...(place.hearsDamage ? HEALING_TRIGGER_EVENTS : []),
    // «Состояние снялось» и «свалил цель» — про живого носителя, который
    // действует и с которого что-то снимают
    ...(place.canRemoveSelf ? CONDITION_LOST_TRIGGER_EVENTS : []),
    ...(place.canRemoveSelf ? OWN_DEED_TRIGGER_EVENTS : []),
    // «Прошёл N футов» — про носителя, у которого есть фишка и путь
    ...(place.canRemoveSelf ? MOVEMENT_TRIGGER_EVENTS : []),
    ...(place.endsWithCast ? (['castEnd'] as const) : []),
    ...(place.canRemoveSelf ? (['rest'] as const) : []),
  ];

  if (triggerEvents.length === 0) {
    return { triggerEvents, triggerActions: [], triggerTurnOwners: [] };
  }

  return {
    triggerEvents,
    triggerActions: [
      'damage',
      'applyCondition',
      'applyTag',
      'reduceMaxHp',
      ...(place.hearsDamage ? (['setHp'] as const) : []),
      'tempHp',
      'move',
      // Сдвинуть можно зону своего каста: её оставляет заклинание, которое
      // живёт вместе с кастом
      ...(place.endsWithCast ? (['moveArea'] as const) : []),
      'removeCondition',
      'kill',
      'revive',
      'dropHeld',
      'restore',
      'dispel',
      'grantInspiration',
      'notify',
      ...(place.hasStages ? (['nextStage'] as const) : []),
      ...(place.canRemoveSelf
        ? (['endCast', 'removeSelf'] as const)
        : (['endCast'] as const)),
    ],
    triggerTurnOwners: place.hasApplier
      ? EFFECT_TRIGGER_TURN_OWNERS
      : TURN_OWNERS_SUBJECT,
  };
}

/**
 * Можно ли отдать действия срабатывания «всем в радиусе».
 *
 * @param event событие.
 * @returns `true` для событий, которые выполняет сервер со сценой.
 */
export function triggerEventAcceptsArea(event: EffectTriggerEvent): boolean {
  return AREA_RECIPIENT_TRIGGER_EVENTS.includes(event);
}

/**
 * Можно ли отдать действия срабатывания наложившему эффект.
 *
 * Те же события, что и у «всем в радиусе»: получателя, кроме субъекта, VTTG
 * ищет только на пути событий сервера. На границе хода действия идут прямо на
 * носителя, и «наложившему» там молча било бы не того.
 *
 * @param event событие.
 * @returns `true` для событий, которые выполняет сервер.
 */
export function triggerEventAcceptsApplier(event: EffectTriggerEvent): boolean {
  return AREA_RECIPIENT_TRIGGER_EVENTS.includes(event);
}

/**
 * Можно ли отдать действия срабатывания выбранным человеком.
 *
 * @param event событие.
 * @returns `true` для событий, где выбор успевают спросить.
 */
export function triggerEventAcceptsChoice(event: EffectTriggerEvent): boolean {
  return CHOICE_RECIPIENT_TRIGGER_EVENTS.includes(event);
}

/**
 * Получатель срабатывания, который работает у события.
 *
 * @param trigger срабатывание.
 * @returns получатель либо `undefined` — субъект.
 */
function resolveDraftRecipient(
  trigger: EffectTrigger,
): EffectTrigger['recipient'] {
  switch (trigger.recipient) {
    case 'other':
      return triggerEventHasOtherParty(trigger.event) ? 'other' : undefined;
    case APPLIER_TRIGGER_RECIPIENT:
      return triggerEventAcceptsApplier(trigger.event)
        ? APPLIER_TRIGGER_RECIPIENT
        : undefined;
    case AREA_TRIGGER_RECIPIENT:
      return triggerEventAcceptsArea(trigger.event)
        ? AREA_TRIGGER_RECIPIENT
        : undefined;
    case CHOICE_TRIGGER_RECIPIENT:
      return triggerEventAcceptsChoice(trigger.event)
        ? CHOICE_TRIGGER_RECIPIENT
        : undefined;
    default:
      return undefined;
  }
}

/**
 * Блок «по выбору» для записи: радиус и число целей — числами, пустое условие
 * не пишется.
 *
 * @param choice блок черновика.
 * @returns блок записи.
 */
function normalizeDraftChoice(
  choice: EffectTriggerChoice | undefined,
): EffectTriggerChoice {
  const count = Math.trunc(
    parseFormNumber(choice?.count) ?? DEFAULT_TRIGGER_CHOICE_COUNT,
  );

  return {
    ...choice,
    radius: Math.max(
      0,
      parseFormNumber(choice?.radius) ?? DEFAULT_TRIGGER_CHOICE_RADIUS,
    ),
    count: Math.min(
      MAX_TRIGGER_CHOICE_COUNT,
      Math.max(DEFAULT_TRIGGER_CHOICE_COUNT, count),
    ),
    condition: choice?.condition?.trim() || undefined,
  };
}

/**
 * Вложенные срабатывания наложенного состояния для записи: без действий и на
 * чужом событии они не пишутся — состояние их всё равно не отработает.
 *
 * @param triggers вложенные срабатывания черновика.
 * @returns срабатывания либо `undefined`.
 */
function normalizeNestedTriggers(
  triggers: readonly NestedEffectTrigger[] | undefined,
): NestedEffectTrigger[] | undefined {
  const kept = (triggers ?? []).filter(
    (trigger) =>
      trigger.actions.length > 0
      && NESTED_TRIGGER_EVENTS.includes(trigger.event),
  );

  return kept.length > 0 ? kept : undefined;
}

/**
 * Считается ли Сл спасброска формулой от данных события — у событий урона есть
 * `@damage`.
 *
 * @param event событие.
 * @returns `true`, если формула Сл работает.
 */
export function triggerEventAcceptsDcFormula(
  event: EffectTriggerEvent,
): boolean {
  return DAMAGE_DATA_TRIGGER_EVENTS.includes(event);
}

/**
 * Есть ли у события другая сторона, которой можно отдать действия: у урона —
 * тот, кто его нанёс, у броска атаки — противник.
 *
 * @param event событие.
 * @returns `true`, если получателя можно выбрать.
 */
export function triggerEventHasOtherParty(event: EffectTriggerEvent): boolean {
  return OTHER_PARTY_TRIGGER_EVENTS.includes(event);
}

/**
 * Выбирается ли у события роль субъекта: атакует он или атакуют его.
 *
 * @param event событие.
 * @returns `true` для броска атаки.
 */
export function triggerEventHasRole(event: EffectTriggerEvent): boolean {
  return event === 'attackRoll';
}

/**
 * События, у которых работает «Хиты становятся»: хиты упали до 0 («вместо 0
 * хитов — 1», Неутомимость) и наложение («восстанавливает все хиты», Слово
 * силы: Исцеление). На остальных событиях ставить хиты числом правилам не
 * нужно: лечение и урон — отдельные действия.
 */
const SET_HP_TRIGGER_EVENTS: readonly EffectTriggerEvent[] = [
  'hpZero',
  'applied',
];

/**
 * Действия, которые работают у срабатывания на это событие в месте формы.
 * «Хиты становятся» — только на нуле хитов и при наложении.
 *
 * @param layout раскладка формы.
 * @param event событие срабатывания.
 * @returns действия.
 */
export function listTriggerActionTypes(
  layout: EffectFormLayout,
  event: EffectTriggerEvent,
): EffectTriggerActionType[] {
  return layout.triggerActions.filter(
    (actionType) =>
      actionType !== 'setHp' || SET_HP_TRIGGER_EVENTS.includes(event),
  );
}

/**
 * Действия вложенного срабатывания — того, что несёт наложенное состояние.
 * Зоны наложенное состояние не оставляет, и сдвигать ему нечего.
 *
 * @param layout раскладка формы.
 * @param event событие вложенного срабатывания.
 * @returns виды действий.
 */
export function listNestedTriggerActionTypes(
  layout: EffectFormLayout,
  event: EffectTriggerEvent,
): EffectTriggerActionType[] {
  return listTriggerActionTypes(layout, event).filter(
    (actionType) => actionType !== 'moveArea',
  );
}

/** Готовые срабатывания списка. */
export const EFFECT_TRIGGER_PRESETS = [
  'recurringDamage',
  'recurringSave',
  'consumeOn',
  'hpZeroToOne',
  'tagOnDamage',
  'custom',
] as const;

/**
 * Готовое срабатывание:
 * - `recurringDamage` — урон каждый ход;
 * - `recurringSave` — повторный спасбросок снимает эффект;
 * - `consumeOn` — снять после своей атаки;
 * - `hpZeroToOne` — вместо 0 хитов 1 хит раз в долгий отдых;
 * - `tagOnDamage` — отметка от урона огнём (до начала следующего хода);
 * - `custom` — своё.
 */
export type EffectTriggerPreset = (typeof EFFECT_TRIGGER_PRESETS)[number];

/**
 * Готовые срабатывания, которые работают в месте формы.
 *
 * @param layout раскладка формы.
 * @returns пресеты в порядке показа.
 */
export function listEffectTriggerPresets(
  layout: EffectFormLayout,
): EffectTriggerPreset[] {
  const { triggerEvents, triggerActions } = layout;

  const available: Record<EffectTriggerPreset, boolean> = {
    recurringDamage:
      triggerEvents.includes('turnStart') && triggerActions.includes('damage'),
    recurringSave:
      triggerEvents.includes('turnEnd')
      && triggerActions.includes('removeSelf'),
    consumeOn:
      triggerEvents.includes('attackRoll')
      && triggerActions.includes('removeSelf'),
    hpZeroToOne:
      triggerEvents.includes('hpZero') && triggerActions.includes('setHp'),
    tagOnDamage:
      triggerEvents.includes('damageTaken')
      && triggerActions.includes('applyTag'),
    custom: triggerEvents.length > 0,
  };

  return EFFECT_TRIGGER_PRESETS.filter((preset) => available[preset]);
}

/**
 * Новое срабатывание по пресету. Спасбросок берёт характеристику и Сл
 * спасброска эффекта: повторный почти всегда повторяет исходный.
 *
 * @param preset пресет.
 * @param effect эффект в форме.
 * @param layout раскладка формы.
 * @returns срабатывание.
 */
export function createEffectTriggerPreset(
  preset: EffectTriggerPreset,
  effect: ActiveEffect,
  layout: EffectFormLayout,
): EffectTrigger {
  const id = createEffectTriggerId();

  switch (preset) {
    case 'recurringDamage':
      return {
        id,
        event: 'turnStart',
        actions: [{ type: 'damage', parts: [] }],
      };
    case 'recurringSave':
      return {
        id,
        event: 'turnEnd',
        save: {
          ability: effect.applySave?.ability ?? DEFAULT_EFFECT_SAVE_ABILITY,
          dc: effect.applySave?.dc ?? defaultSaveDc(layout.minSaveDc),
        },
        actions: [{ type: 'removeSelf', on: 'saved' }],
      };
    case 'consumeOn':
      return {
        id,
        event: 'attackRoll',
        role: DEFAULT_TRIGGER_ATTACK_ROLE,
        actions: [{ type: 'removeSelf', on: 'always' }],
      };
    case 'hpZeroToOne':
      return {
        id,
        event: 'hpZero',
        actions: [{ type: 'setHp', value: DEFAULT_SET_HP_VALUE }],
        limit: { max: MIN_TRIGGER_LIMIT_MAX, per: 'longRest' },
      };
    case 'tagOnDamage':
      return {
        id,
        event: 'damageTaken',
        // Огонь «Регенерации» тролля — тип урона новой части условия
        condition: writeTriggerCondition([
          {
            kind: 'damageType',
            value: EFFECT_TRIGGER_CONDITION_DEFAULT_VALUES.damageType,
          },
        ]),
        actions: [{ type: 'applyTag', tag: DEFAULT_EFFECT_TAG }],
      };
    default:
      return { id, event: layout.triggerEvents[0] ?? 'turnStart', actions: [] };
  }
}

/**
 * Записывает строку списка «Срабатывания»: заменяет, добавляет в конец или
 * убирает. Запись — «сначала старые поля» (`writeEffectTriggers`).
 *
 * @param effect эффект в форме.
 * @param index номер строки; за концом списка — добавление.
 * @param trigger новая строка; `null` — убрать.
 * @returns новый эффект.
 */
export function writeEffectTriggerRow(
  effect: ActiveEffect,
  index: number,
  trigger: EffectTrigger | null,
): ActiveEffect {
  // За концом списка `toSpliced` ничего не удаляет и вставляет строку в конец
  const replacement = trigger === null ? [] : [trigger];

  return writeEffectTriggers(
    effect,
    listEffectListTriggers(effect).toSpliced(index, 1, ...replacement),
  );
}

/**
 * Работает ли явное срабатывание в месте формы: его событие здесь срабатывает,
 * и каждое его действие форма на этом событии предлагает. Иначе срабатывание
 * считалось бы собираемым, хотя действие в списке формы не найти.
 *
 * @param trigger срабатывание.
 * @param layout раскладка формы.
 * @returns `true`, если срабатывание здесь работает целиком.
 */
function isTriggerSupported(
  trigger: EffectTrigger,
  layout: EffectFormLayout,
): boolean {
  if (!layout.triggerEvents.includes(trigger.event)) {
    return false;
  }

  const actionTypes = listTriggerActionTypes(layout, trigger.event);

  return trigger.actions.every((action) => actionTypes.includes(action.type));
}

/**
 * Можно ли Сл 0 — «Сл источника». У заклинания Сл заклинателя проставляется
 * при любом наложении: цели — в момент броска, заклинателю и в зону — до того,
 * как эффект уйдёт жить отдельно. У действия существа и оружия — только цели.
 * Применённое умение бросает против Сл применившего. У зоны мастера и у
 * предмета источника нет: у зелья и свитка Сл всегда своя, числом из текста.
 *
 * @param context место формы.
 * @param delivery доставка эффекта.
 * @param isUsed накладывается ли эффект применением.
 * @returns `true`, если 0 значит «Сл источника».
 */
function acceptsApplierSaveDc(
  context: EffectFormContext,
  delivery: EffectDelivery,
  isUsed: boolean,
): boolean {
  switch (context) {
    case 'ownEffects':
    case 'feature':
      // У применяемого умения копия ложится на цель в момент применения:
      // Сл берётся у того, кто применил
      return isUsed && delivery === 'target';
    case 'generic':
    case 'spell':
      return true;
    case 'creatureAction':
    case 'weapon':
      return delivery === 'target';
    default:
      return false;
  }
}

/** Шаги формы эффекта в порядке показа. */
export const EFFECT_FORM_STEPS = [
  'trigger',
  'save',
  'damage',
  'modifiers',
  'duration',
  'triggers',
] as const;

/**
 * Шаг формы эффекта:
 * - `trigger` — когда и на кого срабатывает;
 * - `save` — спасбросок;
 * - `damage` — урон при срабатывании;
 * - `modifiers` — что эффект меняет;
 * - `duration` — длительность;
 * - `triggers` — срабатывания: урон каждый ход, повторный спасбросок, снятие
 *   после атаки и свои.
 */
export type EffectFormStep = (typeof EFFECT_FORM_STEPS)[number];

/**
 * Шаги, которые есть смысл показать при этой раскладке. Шаг без единого
 * работающего поля не показывается вовсе — нумерация идёт по оставшимся.
 *
 * @param layout раскладка формы.
 * @returns шаги в порядке показа.
 */
export function listEffectFormSteps(
  layout: EffectFormLayout,
): EffectFormStep[] {
  const visibility: Record<EffectFormStep, boolean> = {
    trigger:
      layout.deliveryOptions.length > 1
      || layout.showTrigger
      || layout.activationModes.length > 0
      || layout.showLandingCondition
      || layout.showVariant,
    save:
      layout.showSave
      || layout.saveUnavailableReason !== null
      || layout.successOutcomeForActionSave,
    damage: layout.showTriggerDamage,
    modifiers: true,
    duration: layout.showDuration,
    triggers: layout.triggerEvents.length > 0,
  };

  return EFFECT_FORM_STEPS.filter((step) => visibility[step]);
}

/**
 * Сложность спасброска по умолчанию: там, где 0 значит «Сл источника», — Сл
 * источника, иначе Сл по умолчанию, а не минимум: Сл 1 проходил бы любой.
 *
 * @param minDc минимальная Сл места формы.
 * @returns сложность.
 */
function defaultSaveDc(minDc: number): number {
  return minDc === APPLIER_MIN_SAVE_DC
    ? APPLIER_SAVE_DC
    : DEFAULT_EFFECT_SAVE_DC;
}

/**
 * Подставляет ли место формы Сл источника: 0 в поле Сл значит «Сл источника»,
 * и поле показывает «Авто».
 *
 * @param layout раскладка формы.
 * @returns `true`, если Сл источника подставляется.
 */
export function layoutAcceptsApplierSaveDc(layout: EffectFormLayout): boolean {
  return layout.minSaveDc === APPLIER_MIN_SAVE_DC;
}

/**
 * Спасбросок, который получает строка, когда его включают.
 *
 * @param layout раскладка формы.
 * @returns спасбросок по умолчанию для места формы.
 */
export function createDefaultEffectSave(
  layout: EffectFormLayout,
): EffectTriggerSave {
  return {
    ability: DEFAULT_EFFECT_SAVE_ABILITY,
    dc: defaultSaveDc(layout.minSaveDc),
  };
}

/**
 * Включает или выключает спасбросок эффекта.
 *
 * Выключенный спасбросок забирает с собой и выбор «при успехе»: без спасброска
 * «только при успехе» у ауры или оружия значило бы «никогда». Исключение —
 * эффект на цели заклинания или действия: там выбор относится к их
 * собственному спасброску и остаётся.
 *
 * @param effect эффект.
 * @param enabled нужен ли спасбросок.
 * @param layout раскладка формы.
 * @returns новый эффект.
 */
export function writeEffectSaveEnabled(
  effect: ActiveEffect,
  enabled: boolean,
  layout: EffectFormLayout,
): ActiveEffect {
  if (enabled) {
    const save: EffectSave = effect.applySave ?? {
      ...createDefaultEffectSave(layout),
      onSuccess: 'negate',
    };

    return { ...effect, applySave: save };
  }

  const keepsActionSaveOutcome =
    layout.delivery === 'target' && ACTION_SAVE_CONTEXTS.has(layout.context);

  if (keepsActionSaveOutcome) {
    return { ...effect, applySave: undefined };
  }

  return {
    ...effect,
    applySave: undefined,
    applyOnSuccess: undefined,
    applyOnSuccessOnly: undefined,
  };
}

/**
 * Заполняет эффект данными состояния из шаблона. Берётся то, ЧТО состояние
 * делает (название, модификаторы, флаги, иммунитеты, ключ состояния); как и
 * когда эффект срабатывает (доставка, момент, спасбросок, урон, длительность,
 * источник), остаётся от автора — иначе шаблон «Отравленный» стёр бы у ауры
 * вход и спасбросок.
 *
 * @param effect эффект в форме.
 * @param condition эффект состояния, собранный по шаблону.
 * @returns новый эффект.
 */
export function applyConditionPresetToEffect(
  effect: ActiveEffect,
  condition: ActiveEffect,
): ActiveEffect {
  return {
    ...effect,
    name: condition.name,
    description: condition.description,
    icon: condition.icon,
    conditionKey: condition.conditionKey,
    changes: condition.changes,
    flags: condition.flags,
    conditionImmunities: condition.conditionImmunities,
    exhaustionLevel: condition.exhaustionLevel,
  };
}

/**
 * Поля эффекта, которые заданы, но в этом месте ничего не делают. Форма
 * показывает их плашкой с кнопкой «Убрать», а не стирает молча: запись могла
 * прийти из старого редактора, и решать за автора нельзя.
 *
 * @param effect эффект.
 * @param layout раскладка формы.
 * @returns неработающие поля.
 */
export function listInertEffectFields(
  effect: ActiveEffect,
  layout: EffectFormLayout,
): InertEffectField[] {
  if (layout.context === 'generic') {
    return [];
  }

  const { context, deliveryOptions } = layout;

  const checks: Array<[InertEffectField, boolean]> = [
    [
      'activation',
      effect.activation !== undefined
        && !layout.activationModes.includes(effect.activation.mode),
    ],
    [
      'effectTarget',
      // У предмета и черты существа эффект «на цели» отсекается сбором, у
      // умения копируется на персонажа и ложится на него самого — кроме
      // применяемого: его копия ложится на выбранную цель. «В зону» работает
      // только там, где зона — одна из доставок, и у заклинания с областью
      ((context === 'item'
        || context === 'creatureTrait'
        || context === 'feature')
        && effect.effectTarget === 'target'
        && !deliveryOptions.includes('target'))
        || (effect.effectTarget === 'zone'
          && context !== 'zone'
          && (!deliveryOptions.includes('zone') || !layout.zoneAvailable)),
    ],
    ['aura', Boolean(effect.aura) && !deliveryOptions.includes('aura')],
    [
      'areaTrigger',
      !layout.showTrigger
        && effect.areaTrigger !== undefined
        && effect.areaTrigger !== 'stay',
    ],
    ['applySave', !layout.showSave && effect.applySave !== undefined],
    [
      'successOutcome',
      layout.successOutcomes.length === 0
        && (effect.applyOnSuccess === true
          || effect.applyOnSuccessOnly === true),
    ],
    [
      'damageParts',
      !layout.showTriggerDamage && (effect.damageParts?.length ?? 0) > 0,
    ],
    [
      'recurringDamage',
      !layout.showRecurringDamage && effect.recurringDamage !== undefined,
    ],
    [
      'recurringSave',
      !layout.showRecurringSave && effect.recurringSave !== undefined,
    ],
    ['consumeOn', !layout.showConsumeOn && effect.consumeOn !== undefined],
    [
      'landingCondition',
      !layout.showLandingCondition && effect.landingCondition !== undefined,
    ],
    ['variant', !layout.showVariant && effect.variant !== undefined],
    ['duration', !layout.showDuration && effect.duration.type !== 'permanent'],
    ['charges', !layout.showCharges && effect.charges !== undefined],
    [
      'conditionImmunities',
      !layout.showConditionImmunities
        && (effect.conditionImmunities?.length ?? 0) > 0,
    ],
    [
      'triggers',
      (effect.triggers ?? []).some(
        (trigger) => !isTriggerSupported(trigger, layout),
      ),
    ],
  ];

  return checks.filter(([, isInert]) => isInert).map(([field]) => field);
}

/**
 * Заряды черновика: целые числа, остаток не больше исходного. Автор задаёт
 * «сколько всего», а остаток форма держит равным ему.
 *
 * @param charges заряды из формы.
 * @returns заряды либо `undefined`, если их нет.
 */
function normalizeDraftCharges(
  charges: EffectCharges | undefined,
): EffectCharges | undefined {
  if (!charges) {
    return undefined;
  }

  const max = Math.min(
    MAX_EFFECT_CHARGES,
    Math.max(
      MIN_EFFECT_CHARGES,
      Math.trunc(parseFormNumber(charges.max) ?? MIN_EFFECT_CHARGES),
    ),
  );

  return {
    ...charges,
    max,
    current: Math.min(
      max,
      Math.max(0, Math.trunc(parseFormNumber(charges.current) ?? max)),
    ),
  };
}

/**
 * Убирает у эффекта неработающие поля.
 *
 * @param effect эффект.
 * @param fields поля, которые убрать.
 * @param context место формы (задаёт цель, которая здесь работает).
 * @returns новый эффект.
 */
export function clearInertEffectFields(
  effect: ActiveEffect,
  fields: readonly InertEffectField[],
  context: EffectFormContext,
): ActiveEffect {
  return fields.reduce<ActiveEffect>((cleared, field) => {
    switch (field) {
      case 'effectTarget':
        return {
          ...cleared,
          effectTarget:
            CONTEXT_DELIVERIES[context][0] === 'target' ? 'target' : 'self',
        };
      case 'successOutcome':
        return {
          ...writeEffectSuccessOutcome(cleared, 'nothing'),
          applyOnSuccess: undefined,
          applyOnSuccessOnly: undefined,
        };
      case 'duration':
        return { ...cleared, duration: { type: 'permanent' } };
      case 'charges':
        return { ...cleared, charges: undefined };
      case 'triggers': {
        // Убираются только срабатывания, которые здесь не работают
        const layout = resolveEffectFormLayout(context, cleared);

        const kept = (cleared.triggers ?? []).filter((trigger) =>
          isTriggerSupported(trigger, layout),
        );

        return { ...cleared, triggers: kept.length > 0 ? kept : undefined };
      }
      default:
        return { ...cleared, [field]: undefined };
    }
  }, effect);
}

/**
 * Сложность спасброска не ниже допустимой. Пустое поле — Сл по умолчанию места
 * (`defaultSaveDc`).
 *
 * @param dc сложность из поля.
 * @param minDc минимум места.
 * @returns сложность.
 */
function clampSaveDc(dc: unknown, minDc: number): number {
  return Math.max(
    minDc,
    Math.trunc(parseFormNumber(dc) ?? defaultSaveDc(minDc)),
  );
}

/**
 * Явные срабатывания для записи: без действий — не пишутся (разбор записи их
 * всё равно отбросит), Сл — не ниже допустимой, лимит — от одного раза.
 *
 * @param triggers срабатывания черновика.
 * @param minDc минимум Сл места.
 * @returns срабатывания либо `undefined`.
 */
function normalizeDraftTriggers(
  triggers: readonly EffectTrigger[] | undefined,
  minDc: number,
): EffectTrigger[] | undefined {
  const normalized = (triggers ?? [])
    .map((trigger): EffectTrigger => ({
      ...trigger,
      // Получатель и Сл формулой — только у событий, где они работают
      recipient: resolveDraftRecipient(trigger),
      area:
        resolveDraftRecipient(trigger) === AREA_TRIGGER_RECIPIENT
          ? {
              ...trigger.area,
              radius: Math.max(
                0,
                parseFormNumber(trigger.area?.radius)
                  ?? DEFAULT_TRIGGER_AREA_RADIUS,
              ),
            }
          : undefined,
      choice:
        resolveDraftRecipient(trigger) === CHOICE_TRIGGER_RECIPIENT
          ? normalizeDraftChoice(trigger.choice)
          : undefined,
      // Отметку без годного ключа схема записи выбросила бы вместе со всем
      // срабатыванием — выбрасывается только само действие
      actions: trigger.actions
        .filter(
          (action) => action.type !== 'applyTag' || isEffectTag(action.tag),
        )
        .map((action) =>
          action.type === 'applyCondition'
            ? {
                ...action,
                triggers: normalizeNestedTriggers(action.triggers),
              }
            : action,
        ),
      save: trigger.save
        ? {
            ...trigger.save,
            dc: clampSaveDc(trigger.save.dc, minDc),
            dcFormula: triggerEventAcceptsDcFormula(trigger.event)
              ? trigger.save.dcFormula?.trim() || undefined
              : undefined,
          }
        : undefined,
      limit: trigger.limit
        ? {
            ...trigger.limit,
            max: Math.max(
              MIN_TRIGGER_LIMIT_MAX,
              Math.trunc(
                parseFormNumber(trigger.limit.max) ?? MIN_TRIGGER_LIMIT_MAX,
              ),
            ),
          }
        : undefined,
    }))
    .filter((trigger) => trigger.actions.length > 0);

  return normalized.length > 0 ? normalized : undefined;
}

/**
 * Действие «вырваться» к виду данных: Сл не ниже допустимой в этом месте,
 * пустая подпись — отсутствием поля.
 *
 * @param escape блок действия из формы.
 * @param minSaveDc наименьшая Сл места формы.
 * @returns блок для сохранения либо `undefined`.
 */
function normalizeDraftEscape(
  escape: EffectEscape | undefined,
  minSaveDc: number,
): EffectEscape | undefined {
  if (!escape) {
    return undefined;
  }

  return {
    ...escape,
    label: escape.label?.trim() || undefined,
    check: escape.check
      ? { ...escape.check, dc: clampSaveDc(escape.check.dc, minSaveDc) }
      : undefined,
  };
}

/**
 * Приводит черновик к записи перед сохранением: числа из полей — числами,
 * Сл — не ниже допустимой, пустые списки — отсутствием поля.
 *
 * @param draft черновик формы.
 * @param layout раскладка формы.
 * @returns эффект для сохранения.
 */
export function normalizeEffectDraft(
  draft: ActiveEffect,
  layout: EffectFormLayout,
): ActiveEffect {
  // Ступень должна действовать, а не лежать списком: строки и флаги эффекта
  // берутся из действующей ступени, иначе правка ступени ни на что не влияла бы
  const effect = applyEffectStage(draft);

  const durationValue = parseFormNumber(effect.duration.value);
  const landingCondition = effect.landingCondition?.trim();
  const variantGroup = effect.variant?.group.trim();
  const variantLabel = effect.variant?.label.trim();

  // Шаблон применения на своём листе лежит выключенным (withActivationDefaults)
  const disabled =
    layout.context === 'ownEffects' && isUseActivatedEffect(effect)
      ? true
      : effect.disabled;

  return {
    ...effect,
    disabled,
    name: effect.name.trim(),
    landingCondition: landingCondition || undefined,
    rollCondition: effect.rollCondition?.trim() || undefined,
    savedRoll: effect.savedRoll?.trim() || undefined,
    charges: normalizeDraftCharges(effect.charges),
    durationFormula: effect.durationFormula?.trim() || undefined,
    activation: normalizeDraftActivation(effect.activation),
    variant:
      effect.variant && variantGroup && variantLabel
        ? { ...effect.variant, group: variantGroup, label: variantLabel }
        : undefined,
    duration: {
      ...effect.duration,
      value:
        durationValue === undefined
          ? undefined
          : Math.max(0, Math.trunc(durationValue)),
    },
    changes: effect.changes.map((change) => ({
      ...change,
      priority: Math.trunc(
        parseFormNumber(change.priority) ?? DEFAULT_EFFECT_CHANGE_PRIORITY,
      ),
    })),
    aura: effect.aura
      ? {
          ...effect.aura,
          radius: Math.max(0, parseFormNumber(effect.aura.radius) ?? 0),
          radiusFormula: effect.aura.radiusFormula?.trim() || undefined,
          whileCapable: effect.aura.whileCapable || undefined,
        }
      : undefined,
    applySave: effect.applySave
      ? {
          ...effect.applySave,
          dc: clampSaveDc(effect.applySave.dc, layout.minSaveDc),
        }
      : undefined,
    recurringSave: effect.recurringSave
      ? {
          ...effect.recurringSave,
          dc: clampSaveDc(effect.recurringSave.dc, layout.minSaveDc),
        }
      : undefined,
    recurringDamage: effect.recurringDamage
      ? {
          ...effect.recurringDamage,
          save: effect.recurringDamage.save
            ? {
                ...effect.recurringDamage.save,
                dc: clampSaveDc(
                  effect.recurringDamage.save.dc,
                  layout.minSaveDc,
                ),
              }
            : undefined,
        }
      : undefined,
    damageParts: effect.damageParts?.length ? effect.damageParts : undefined,
    conditionImmunities: effect.conditionImmunities?.length
      ? effect.conditionImmunities
      : undefined,
    triggers: normalizeDraftTriggers(effect.triggers, layout.minSaveDc),
    stages: effect.stages?.length ? effect.stages : undefined,
    stageIndex: effect.stages?.length
      ? resolveEffectStageIndex(effect)
      : undefined,
    escape: normalizeDraftEscape(effect.escape, layout.minSaveDc),
  };
}
