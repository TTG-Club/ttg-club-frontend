/**
 * Чтение и запись срабатываний эффекта.
 *
 * Старые поля эффекта — урон каждый ход, повторный спасбросок, снятие после
 * атаки, спасбросок и урон срабатывания — читаются как срабатывания
 * `legacy.*`, явные `triggers` добавляются следом. Так весь код, которому нужно
 * «что эффект делает на событии», читает один список, а данные контента не
 * меняются.
 *
 * Запись идёт «сначала старые поля»: строка, которую выражает старое поле,
 * пишется в него — прежние версии VTTG читают такой контент как раньше. В
 * `triggers` уходит только то, чего старые поля не выражают (лимит, состояние
 * на ходу, ход источника, условие, второе однотипное срабатывание).
 *
 * Зеркало: dnd5-test-migrate/src/engine/effectTriggers.ts
 */

import type {
  EffectTrigger,
  EffectTriggerAction,
  EffectTriggerActionGate,
  EffectTriggerEvent,
  EffectTriggerSave,
  LegacyTriggerKind,
} from './triggerTypes';
import type { ActiveEffect, EffectSaveTiming } from './types';

import {
  CONDITION_LOST_TRIGGER_EVENTS,
  isEffectTag,
  LEGACY_TRIGGER_ID_PREFIX,
  LEGACY_TRIGGER_IDS,
  MOVEMENT_TRIGGER_EVENTS,
  TURN_TRIGGER_EVENTS,
} from './triggerTypes';
import { createEntityId } from './utils';

/** Приставка id нового срабатывания. */
const TRIGGER_ID_PREFIX = 'trigger';

/** Срабатывания эффекта уже прочитаны — эффект в форме не мутируется. */
const collectedTriggers = new WeakMap<ActiveEffect, readonly EffectTrigger[]>();

/**
 * Id нового срабатывания списка.
 *
 * @returns id.
 */
export function createEffectTriggerId(): string {
  return createEntityId(TRIGGER_ID_PREFIX);
}

/**
 * Выведено ли срабатывание из старого поля эффекта.
 *
 * @param trigger срабатывание.
 * @returns `true` для id `legacy.*`.
 */
export function isLegacyTrigger(trigger: Pick<EffectTrigger, 'id'>): boolean {
  return trigger.id.startsWith(LEGACY_TRIGGER_ID_PREFIX);
}

/**
 * Гейт действия, если он не задан: при спасброске — провал, без него — всегда.
 * Урон «половина при успехе» по смыслу бьёт при любом исходе.
 *
 * @param trigger срабатывание.
 * @param action действие.
 * @returns гейт.
 */
export function resolveTriggerActionGate(
  trigger: Pick<EffectTrigger, 'save'>,
  action: EffectTriggerAction,
): EffectTriggerActionGate {
  if (action.on) {
    return action.on;
  }

  const halvesOnSave = action.type === 'damage' && action.halfOnSave === true;

  return trigger.save && !halvesOnSave ? 'failed' : 'always';
}

/** Гейты разового срабатывания по выбору «при успехе». */
interface EffectLandingGates {
  /** Когда бьёт урон эффекта. */
  damage: EffectTriggerActionGate;
  /** Урон при успехе — половина. */
  halfOnSave: boolean;
  /** Когда ложится сам эффект. */
  effect: EffectTriggerActionGate;
}

/**
 * Гейты разового срабатывания эффекта: пять исходов «при успехе» старых полей
 * (`applySave.onSuccess`, `applyOnSuccess`, `applyOnSuccessOnly`).
 *
 * @param effect эффект.
 * @returns гейты урона и наложения.
 */
function resolveEffectLandingGates(effect: ActiveEffect): EffectLandingGates {
  if (effect.applyOnSuccessOnly) {
    return { damage: 'saved', halfOnSave: false, effect: 'saved' };
  }

  const halfDamage = effect.applySave?.onSuccess === 'half';

  return {
    damage: halfDamage ? 'always' : 'failed',
    halfOnSave: halfDamage,
    effect: effect.applyOnSuccess ? 'always' : 'failed',
  };
}

/**
 * Событие хода по отметке времени хода.
 *
 * @param timing начало или конец хода.
 * @returns событие.
 */
function turnTriggerEventOf(timing: EffectSaveTiming): EffectTriggerEvent {
  return timing === 'startOfTurn' ? 'turnStart' : 'turnEnd';
}

/**
 * Отметка времени хода по событию хода — обратное к `turnTriggerEventOf`.
 *
 * @param event событие начала или конца хода.
 * @returns начало хода для `turnStart`, иначе конец хода.
 */
export function saveTimingOfTriggerEvent(
  event: EffectTriggerEvent,
): EffectSaveTiming {
  return event === 'turnStart' ? 'startOfTurn' : 'endOfTurn';
}

/**
 * Разовое срабатывание эффекта: спасбросок и урон при наложении на цель или при
 * входе и выходе.
 *
 * @param effect эффект.
 * @param event событие срабатывания.
 * @returns срабатывание: урон (если есть) и длящаяся копия эффекта.
 */
function readEffectLandingTrigger(
  effect: ActiveEffect,
  event: EffectTriggerEvent,
): EffectTrigger {
  const gates = resolveEffectLandingGates(effect);
  const actions: EffectTriggerAction[] = [];

  if (effect.damageParts && effect.damageParts.length > 0) {
    actions.push({
      type: 'damage',
      parts: effect.damageParts,
      on: gates.damage,
      ...(gates.halfOnSave ? { halfOnSave: true as const } : {}),
    });
  }

  actions.push({ type: 'applySelf', on: gates.effect });

  return {
    id: LEGACY_TRIGGER_IDS.landing,
    event,
    ...(effect.applySave
      ? {
          save: {
            ability: effect.applySave.ability,
            dc: effect.applySave.dc,
          },
        }
      : {}),
    actions,
  };
}

/**
 * Разовое срабатывание в списке срабатываний эффекта. Событие — по доставке; у
 * эффекта «на носителе» и «пока внутри» разового срабатывания нет (поля там не
 * работают).
 *
 * @param effect эффект.
 * @returns срабатывание либо `null`.
 */
function readLandingTrigger(effect: ActiveEffect): EffectTrigger | null {
  const hasLanding =
    effect.applySave !== undefined
    || (effect.damageParts?.length ?? 0) > 0
    || effect.applyOnSuccess === true
    || effect.applyOnSuccessOnly === true;

  let event: EffectTriggerEvent | null = null;

  if (effect.effectTarget === 'target') {
    event = 'applied';
  } else if (effect.areaTrigger === 'enter' || effect.areaTrigger === 'exit') {
    event = effect.areaTrigger;
  }

  return hasLanding && event ? readEffectLandingTrigger(effect, event) : null;
}

/**
 * Срабатывания из старых полей хода и атаки.
 *
 * @param effect эффект.
 * @returns срабатывания в порядке полей.
 */
function readLegacyListTriggers(effect: ActiveEffect): EffectTrigger[] {
  const triggers: EffectTrigger[] = [];
  const { recurringDamage, recurringSave, consumeOn } = effect;

  if (recurringDamage) {
    const { save } = recurringDamage;
    const isHalfDamage = save?.onSuccess === 'half';

    triggers.push({
      id: LEGACY_TRIGGER_IDS.recurringDamage,
      event: turnTriggerEventOf(recurringDamage.timing),
      ...(save ? { save: { ability: save.ability, dc: save.dc } } : {}),
      actions: [
        {
          type: 'damage',
          parts: recurringDamage.damageParts,
          on: save && !isHalfDamage ? 'failed' : 'always',
          ...(isHalfDamage ? { halfOnSave: true as const } : {}),
        },
      ],
    });
  }

  if (recurringSave) {
    triggers.push({
      id: LEGACY_TRIGGER_IDS.recurringSave,
      event: turnTriggerEventOf(recurringSave.timing),
      save: { ability: recurringSave.ability, dc: recurringSave.dc },
      actions: [{ type: 'removeSelf', on: 'saved' }],
    });
  }

  if (consumeOn) {
    triggers.push({
      id: LEGACY_TRIGGER_IDS.consumeOn,
      event: 'attackRoll',
      role: consumeOn === 'carrierAttack' ? 'attacker' : 'target',
      actions: [{ type: 'removeSelf', on: 'always' }],
    });
  }

  return triggers;
}

/**
 * Все срабатывания эффекта: разовое при наложении или входе, старые поля хода и
 * атаки, затем явные `triggers`.
 *
 * Результат кэшируется по объекту эффекта и не должен мутироваться.
 *
 * @param effect эффект.
 * @returns срабатывания.
 */
export function collectEffectTriggers(
  effect: ActiveEffect,
): readonly EffectTrigger[] {
  const cached = collectedTriggers.get(effect);

  if (cached) {
    return cached;
  }

  const landing = readLandingTrigger(effect);

  const triggers = [
    ...(landing ? [landing] : []),
    ...readLegacyListTriggers(effect),
    ...(effect.triggers ?? []),
  ];

  collectedTriggers.set(effect, triggers);

  return triggers;
}

/**
 * Срабатывания списка «Срабатывания» — всё, кроме разового при наложении или
 * входе: его настраивают шаги «Когда срабатывает», «Спасбросок» и «Урон».
 *
 * @param effect эффект.
 * @returns срабатывания списка.
 */
export function listEffectListTriggers(
  effect: ActiveEffect,
): readonly EffectTrigger[] {
  return collectEffectTriggers(effect).filter(
    (trigger) => trigger.id !== LEGACY_TRIGGER_IDS.landing,
  );
}

/**
 * Событие начала или конца хода: у него выбирается, чей это ход.
 *
 * @param event событие срабатывания.
 * @returns `true` для событий хода.
 */
export function isTurnTriggerEvent(event: EffectTriggerEvent): boolean {
  return TURN_TRIGGER_EVENTS.includes(event);
}

/**
 * Выбирается ли у события отдых: «после долгого», «после короткого».
 *
 * @param event событие срабатывания.
 * @returns `true` для события отдыха.
 */
export function triggerEventHasRestType(event: EffectTriggerEvent): boolean {
  return event === 'rest';
}

/**
 * Ключи отметок, которые ставят срабатывания: их предлагает условие «на
 * носителе отметка» того же эффекта.
 *
 * @param triggers срабатывания эффекта.
 * @returns годные ключи без повторов в порядке появления.
 */
export function listTriggerTags(triggers: readonly EffectTrigger[]): string[] {
  const tags = triggers.flatMap((trigger) =>
    trigger.actions.flatMap((action) =>
      action.type === 'applyTag' && isEffectTag(action.tag) ? [action.tag] : [],
    ),
  );

  return [...new Set(tags)];
}

/**
 * Простое срабатывание: без роли, условия и лимита, ход — субъекта.
 *
 * Список закрытый и обязан расти вместе с полями срабатывания: то, чего старые
 * поля не выражают, нельзя в них записывать — настройка молча пропала бы при
 * сохранении, а форма после переоткрытия показала бы её пустой.
 *
 * @param trigger срабатывание.
 * @returns `true`, если ничего сверх события, спасброска и действий нет.
 */
function isPlainTrigger(trigger: EffectTrigger): boolean {
  return (
    trigger.condition === undefined
    && trigger.limit === undefined
    // Получателя старые поля не знают: урон каждый ход всегда про носителя
    && trigger.recipient === undefined
    && (trigger.turnOf === undefined || trigger.turnOf === 'subject')
    // Цены, вопроса человеку и шанса срабатывания у старых полей нет
    && trigger.cost === undefined
    && trigger.ask === undefined
    && trigger.chancePercent === undefined
    && isPlainTriggerSave(trigger.save)
  );
}

/**
 * Простой спасбросок срабатывания: без режима по условию и без
 * автоматического исхода — их старые поля тоже не выражают.
 *
 * @param save спасбросок срабатывания.
 * @returns `true`, если спасброска нет или он простой.
 */
function isPlainTriggerSave(save: EffectTriggerSave | undefined): boolean {
  return (
    save === undefined
    || (save.modeIf === undefined
      && save.autoSuccessIf === undefined
      && save.autoFailIf === undefined)
  );
}

/**
 * Выбирается ли у события состояние: «когда состояние снимается» слушает одно
 * состояние или любое.
 *
 * @param event событие срабатывания.
 * @returns `true` для события снятия состояния.
 */
export function triggerEventHasConditionKey(
  event: EffectTriggerEvent,
): boolean {
  return CONDITION_LOST_TRIGGER_EVENTS.includes(event);
}

/**
 * Событие перемещения: у него выбирается шаг пути — «за каждые N футов».
 *
 * @param event событие срабатывания.
 * @returns `true` для события перемещения.
 */
export function triggerEventHasPathFeet(event: EffectTriggerEvent): boolean {
  return MOVEMENT_TRIGGER_EVENTS.includes(event);
}

/**
 * Какое старое поле выражает срабатывание без потерь.
 *
 * @param trigger срабатывание.
 * @returns вид старого поля либо `null`.
 */
export function classifyLegacyTrigger(
  trigger: EffectTrigger,
): LegacyTriggerKind | null {
  const [action] = trigger.actions;

  if (!isPlainTrigger(trigger) || trigger.actions.length !== 1 || !action) {
    return null;
  }

  const isTurn = isTurnTriggerEvent(trigger.event);
  const gate = resolveTriggerActionGate(trigger, action);

  if (isTurn && trigger.role === undefined && action.type === 'damage') {
    if (!trigger.save) {
      return gate === 'always' && !action.halfOnSave ? 'recurringDamage' : null;
    }

    const negatesOnSuccess = gate === 'failed' && !action.halfOnSave;
    const halvesOnSuccess = gate === 'always' && action.halfOnSave === true;

    return negatesOnSuccess || halvesOnSuccess ? 'recurringDamage' : null;
  }

  if (
    isTurn
    && trigger.role === undefined
    && trigger.save
    && action.type === 'removeSelf'
    && gate === 'saved'
  ) {
    return 'recurringSave';
  }

  if (
    trigger.event === 'attackRoll'
    && trigger.role !== undefined
    && trigger.turnOf === undefined
    && !trigger.save
    && action.type === 'removeSelf'
    && gate === 'always'
  ) {
    return 'consumeOn';
  }

  return null;
}

/**
 * Старое поле по срабатыванию, которое оно выражает.
 *
 * @param kind вид старого поля.
 * @param trigger срабатывание того же вида.
 * @returns поля эффекта.
 */
function toLegacyFields(
  kind: LegacyTriggerKind,
  trigger: EffectTrigger,
): Pick<ActiveEffect, 'recurringDamage' | 'recurringSave' | 'consumeOn'> {
  const [action] = trigger.actions;
  const timing = saveTimingOfTriggerEvent(trigger.event);

  if (kind === 'recurringDamage' && action?.type === 'damage') {
    return {
      recurringDamage: {
        damageParts: action.parts,
        timing,
        ...(trigger.save
          ? {
              save: {
                ability: trigger.save.ability,
                dc: trigger.save.dc,
                onSuccess: action.halfOnSave ? 'half' : 'negate',
              },
            }
          : {}),
      },
    };
  }

  if (kind === 'recurringSave' && trigger.save) {
    return {
      recurringSave: {
        ability: trigger.save.ability,
        dc: trigger.save.dc,
        timing,
      },
    };
  }

  return {
    consumeOn: trigger.role === 'target' ? 'attackOnCarrier' : 'carrierAttack',
  };
}

/**
 * Записывает список «Срабатывания» в эффект: выражаемое старым полем — в него,
 * остальное — в `triggers`. Разовое срабатывание при наложении или входе список
 * не трогает. Старые поля, которых в списке больше нет, снимаются.
 *
 * @param effect эффект.
 * @param triggers строки списка.
 * @returns новый эффект.
 */
export function writeEffectTriggers(
  effect: ActiveEffect,
  triggers: readonly EffectTrigger[],
): ActiveEffect {
  let legacy: Pick<
    ActiveEffect,
    'recurringDamage' | 'recurringSave' | 'consumeOn'
  > = {};

  const explicit: EffectTrigger[] = [];

  for (const trigger of triggers) {
    if (trigger.id === LEGACY_TRIGGER_IDS.landing) {
      continue;
    }

    const kind = classifyLegacyTrigger(trigger);

    if (kind && legacy[kind] === undefined) {
      legacy = { ...legacy, ...toLegacyFields(kind, trigger) };

      continue;
    }

    explicit.push(
      isLegacyTrigger(trigger)
        ? { ...trigger, id: createEffectTriggerId() }
        : trigger,
    );
  }

  return {
    ...effect,
    recurringDamage: legacy.recurringDamage,
    recurringSave: legacy.recurringSave,
    consumeOn: legacy.consumeOn,
    triggers: explicit.length > 0 ? explicit : undefined,
  };
}
