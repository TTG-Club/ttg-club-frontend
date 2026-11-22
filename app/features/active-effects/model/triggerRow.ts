/**
 * Правка строки списка «Срабатывания» в форме: новое действие, смена события,
 * исход и срок действия. Отдельно от чтения и записи срабатываний
 * (`triggers.ts`): правке нужна раскладка формы, а раскладка сама читает
 * срабатывания — в одном модуле они замкнулись бы в цикл импортов.
 */

import type { EffectFormLayout, EffectTriggerActionType } from './layout';
import type { EffectTriggerDamageGateChoice } from './options';
import type {
  EffectTrigger,
  EffectTriggerAction,
  EffectTriggerEvent,
  EffectTriggerSave,
} from './triggerTypes';

import {
  DEFAULT_DISPEL_MAX_LEVEL,
  DEFAULT_MAX_HP_REDUCTION,
  DEFAULT_TRIGGER_CONDITION,
  DEFAULT_TRIGGER_NOTIFY_TEXT,
  DEFAULT_TRIGGER_TEMP_HP,
  EFFECT_TRIGGER_DAMAGE_HALF_GATE,
  MIN_TRIGGER_ACTION_ROUNDS,
} from './constants';
import {
  DEFAULT_SET_HP_VALUE,
  listTriggerActionTypes,
  triggerEventAcceptsArea,
  triggerEventAcceptsChoice,
  triggerEventAcceptsDcFormula,
  triggerEventHasRole,
} from './layout';
import { buildTriggerRecipientOptions } from './options';
import {
  isTurnTriggerEvent,
  triggerEventHasConditionKey,
  triggerEventHasPathFeet,
  triggerEventHasRestType,
} from './triggers';
import {
  DEFAULT_EFFECT_TAG,
  DEFAULT_RESTORE_KIND,
  DEFAULT_TRIGGER_AREA_SHIFT_KIND,
  DEFAULT_TRIGGER_ATTACK_ROLE,
  DEFAULT_TRIGGER_MOVE_DISTANCE,
  DEFAULT_TRIGGER_MOVE_KIND,
  MIN_REVIVE_HP,
  MIN_SPELL_SLOT_LEVEL,
} from './triggerTypes';

/**
 * Новое действие срабатывания со значениями по умолчанию: урон без частей,
 * состояние по умолчанию, отметка с ключом по умолчанию, «Хиты становятся» — 1,
 * уменьшение максимума хитов — на урон события. Действие с обязательными
 * полями получает их сразу: пустой `{ type }` выпал бы при следующем открытии.
 *
 * @param type вид действия.
 * @returns действие.
 */
export function createEffectTriggerAction(
  type: EffectTriggerActionType,
): EffectTriggerAction {
  switch (type) {
    case 'damage':
      return { type, parts: [] };
    case 'applyCondition':
      return { type, conditionKey: DEFAULT_TRIGGER_CONDITION };
    case 'applyTag':
      return { type, tag: DEFAULT_EFFECT_TAG };
    case 'setHp':
      return { type, value: DEFAULT_SET_HP_VALUE };
    case 'reduceMaxHp':
      return { type, amount: DEFAULT_MAX_HP_REDUCTION };
    case 'notify':
      return { type, text: DEFAULT_TRIGGER_NOTIFY_TEXT };
    case 'tempHp':
      return { type, amount: DEFAULT_TRIGGER_TEMP_HP };
    case 'removeCondition':
      return { type, conditionKey: DEFAULT_TRIGGER_CONDITION };
    case 'revive':
      return { type, hp: MIN_REVIVE_HP };
    case 'restore':
      return { type, what: DEFAULT_RESTORE_KIND, level: MIN_SPELL_SLOT_LEVEL };
    case 'dispel':
      return { type, maxLevel: DEFAULT_DISPEL_MAX_LEVEL };
    case 'move':
      return {
        type,
        kind: DEFAULT_TRIGGER_MOVE_KIND,
        distance: DEFAULT_TRIGGER_MOVE_DISTANCE,
      };
    case 'moveArea':
      return {
        type,
        kind: DEFAULT_TRIGGER_AREA_SHIFT_KIND,
        distance: DEFAULT_TRIGGER_MOVE_DISTANCE,
      };
    default:
      return { type };
  }
}

/**
 * Действие без исхода и «половины при успехе»: без спасброска исход не
 * выбирается.
 *
 * @param action действие.
 * @returns действие без привязки к спасброску.
 */
export function clearTriggerActionGate(
  action: EffectTriggerAction,
): EffectTriggerAction {
  if (action.type === 'damage') {
    return { type: 'damage', parts: action.parts };
  }

  return { ...action, on: undefined };
}

/**
 * Спасбросок срабатывания без формулы Сл: остальное — характеристика, число,
 * режим и условия режима — остаётся.
 *
 * @param save спасбросок строки.
 * @returns спасбросок без формулы.
 */
export function omitTriggerSaveDcFormula(
  save: EffectTriggerSave,
): EffectTriggerSave {
  const { dcFormula: _dcFormula, ...saveWithoutFormula } = save;

  return saveWithoutFormula;
}

/**
 * Строка срабатывания под новое событие. Смена события отбрасывает то, чего у
 * нового события нет: действия, которые на нём не работают, роль в броске
 * атаки, получателя с его радиусом, чей ход, отдых, снятое состояние, шаг пути
 * и формулу Сл. Роль у броска атаки остаётся прежней, а если её не было —
 * берётся роль по умолчанию.
 *
 * @param trigger строка срабатывания.
 * @param nextEvent новое событие.
 * @param layout раскладка формы: какие действия работают в этом месте.
 * @returns новая строка.
 */
export function writeTriggerEvent(
  trigger: EffectTrigger,
  nextEvent: EffectTriggerEvent,
  layout: EffectFormLayout,
): EffectTrigger {
  const allowedActionTypes = listTriggerActionTypes(layout, nextEvent);
  const { save } = trigger;
  const dropsDcFormula = !triggerEventAcceptsDcFormula(nextEvent);

  return {
    ...trigger,
    event: nextEvent,
    role: triggerEventHasRole(nextEvent)
      ? (trigger.role ?? DEFAULT_TRIGGER_ATTACK_ROLE)
      : undefined,
    turnOf: isTurnTriggerEvent(nextEvent) ? trigger.turnOf : undefined,
    restType: triggerEventHasRestType(nextEvent) ? trigger.restType : undefined,
    conditionKey: triggerEventHasConditionKey(nextEvent)
      ? trigger.conditionKey
      : undefined,
    everyFeet: triggerEventHasPathFeet(nextEvent)
      ? trigger.everyFeet
      : undefined,
    // Недоступного получателя новое событие не наследует
    recipient: buildTriggerRecipientOptions({ ...trigger, event: nextEvent })
      .map((recipientOption) => recipientOption.value)
      .find((recipientValue) => recipientValue === trigger.recipient),
    area: triggerEventAcceptsArea(nextEvent) ? trigger.area : undefined,
    choice: triggerEventAcceptsChoice(nextEvent) ? trigger.choice : undefined,
    save: save && dropsDcFormula ? omitTriggerSaveDcFormula(save) : save,
    actions: trigger.actions.filter((action) =>
      allowedActionTypes.includes(action.type),
    ),
  };
}

/**
 * Действие с исходом, выбранным в списке. Прежний исход и «половина при
 * успехе» снимаются. «Провал — полный, успех — половина» бывает только у
 * урона: такой урон бьёт при любом исходе и при успехе вдвое слабее.
 *
 * @param action действие.
 * @param choice выбранный исход.
 * @returns новое действие либо `null`, если «половину» выбрали не у урона.
 */
export function writeTriggerActionGate(
  action: EffectTriggerAction,
  choice: EffectTriggerDamageGateChoice,
): EffectTriggerAction | null {
  const clearedAction = clearTriggerActionGate(action);

  if (choice !== EFFECT_TRIGGER_DAMAGE_HALF_GATE) {
    return { ...clearedAction, on: choice };
  }

  return clearedAction.type === 'damage'
    ? { ...clearedAction, on: 'always', halfOnSave: true }
    : null;
}

/**
 * Срок состояния или отметки действия в раундах.
 *
 * @param action действие.
 * @returns раундов либо `null`, если срок не в раундах или у действия его нет.
 */
export function readTriggerActionRounds(
  action: EffectTriggerAction,
): number | null {
  return (action.type === 'applyCondition' || action.type === 'applyTag')
    && action.duration?.type === 'rounds'
    ? (action.duration.value ?? null)
    : null;
}

/**
 * Действие состояния или отметки с новым сроком в раундах. Пустое поле или
 * ноль снимают срок целиком: срок без числа система не поймёт, и остаётся срок
 * по умолчанию (состояние — пока не снимут, отметка — до начала следующего
 * хода). У остальных действий срока нет, они возвращаются как есть.
 *
 * @param action действие.
 * @param rounds раундов из поля; очищенное поле числа отдаёт `undefined`.
 * @returns новое действие.
 */
export function writeTriggerActionRounds(
  action: EffectTriggerAction,
  rounds: number | null | undefined,
): EffectTriggerAction {
  if (action.type !== 'applyCondition' && action.type !== 'applyTag') {
    return action;
  }

  return {
    ...action,
    duration:
      typeof rounds === 'number' && rounds > MIN_TRIGGER_ACTION_ROUNDS
        ? { type: 'rounds', value: rounds }
        : undefined,
  };
}
