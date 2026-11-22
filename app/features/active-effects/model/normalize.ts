/**
 * Нормализация активных эффектов перед отправкой на сервер.
 */

import type { EffectFormContext, EffectFormLayoutOptions } from './layout';
import type { EffectTrigger } from './triggerTypes';
import type {
  ActiveEffect,
  EffectChange,
  EffectDamagePart,
  EffectDuration,
  EffectStage,
} from './types';

import {
  DEFAULT_EFFECT_TURN_ANCHOR,
  DEFAULT_EFFECT_TURN_TIMING,
} from './constants';
import {
  normalizeEffectDraft,
  readEffectSuccessOutcome,
  resolveEffectFormLayout,
  writeEffectSuccessOutcome,
} from './layout';
import { DEFAULT_EFFECT_DAMAGE_PART_TARGET } from './types';

/**
 * Нормализует часть урона эффекта: trim формулы, сброс пустых полей.
 *
 * @param part часть урона.
 * @returns часть без пустых полей.
 */
function normalizeEffectDamagePart(part: EffectDamagePart): EffectDamagePart {
  return {
    // Тип урона живёт токеном `@dmg.*` в самой формуле (легаси-поле переносится
    // туда при загрузке), поэтому наружу оно не уходит: два источника типа рано
    // или поздно разошлись бы.
    formula: part.formula.trim(),
    type: undefined,
    target: part.target ?? DEFAULT_EFFECT_DAMAGE_PART_TARGET,
    requiresDamage: part.requiresDamage || undefined,
  };
}

/**
 * Отбрасывает части без формулы и нормализует оставшиеся.
 *
 * @param parts части урона.
 * @returns части с формулой; пусто — `undefined`.
 */
function normalizeEffectDamageParts(
  parts: EffectDamagePart[] | undefined,
): EffectDamagePart[] | undefined {
  const cleaned = (parts ?? [])
    .filter((part) => part.formula.trim().length > 0)
    .map(normalizeEffectDamagePart);

  return cleaned.length > 0 ? cleaned : undefined;
}

/**
 * Нормализует одно изменение: trim ключа и значения, пустое условие —
 * отсутствие поля.
 *
 * @param change изменение эффекта.
 * @returns изменение без пробелов по краям.
 */
function normalizeEffectChange(change: EffectChange): EffectChange {
  const condition = change.condition?.trim();

  return {
    key: change.key.trim(),
    mode: change.mode,
    value: change.value.trim(),
    condition: condition || undefined,
    step: change.step,
    priority: change.priority,
  };
}

/**
 * Нормализует строки модификаторов: пустые (без ключа или значения) не
 * пишутся.
 *
 * @param changes строки модификаторов.
 * @returns строки без пустых.
 */
function normalizeEffectChanges(changes: EffectChange[]): EffectChange[] {
  return changes
    .map(normalizeEffectChange)
    .filter((change) => change.key.length > 0 && change.value.length > 0);
}

/**
 * Нормализует флаги: пустые не пишутся.
 *
 * @param flags флаги.
 * @returns флаги без пробелов по краям и без пустых.
 */
function normalizeEffectFlags(flags: string[]): string[] {
  return flags.map((flag) => flag.trim()).filter((flag) => flag.length > 0);
}

/**
 * Нормализует ступени так же, как строки самого эффекта: действующая ступень
 * переписывает строки эффекта, и расходиться с ними она не должна.
 *
 * @param stages ступени эффекта.
 * @returns ступени с нормализованными строками и флагами.
 */
function normalizeEffectStages(
  stages: EffectStage[] | undefined,
): EffectStage[] | undefined {
  return stages?.map((stage) => ({
    ...stage,
    label: stage.label.trim(),
    changes: normalizeEffectChanges(stage.changes),
    flags: normalizeEffectFlags(stage.flags),
  }));
}

/**
 * Нормализует длительность: якорь и момент хода осмысленны только у точной
 * «ходовой» длительности, а у остальных типов они молча сбивали бы с толку —
 * поле в форме скрыто, а значение от прошлого выбора осталось бы в записи.
 *
 * @param duration длительность эффекта.
 * @returns длительность без лишних полей.
 */
function normalizeEffectDuration(duration: EffectDuration): EffectDuration {
  if (duration.type !== 'turn') {
    return {
      type: duration.type,
      value: duration.value,
      remaining: duration.remaining,
    };
  }

  return {
    type: duration.type,
    turnAnchor: duration.turnAnchor ?? DEFAULT_EFFECT_TURN_ANCHOR,
    turnTiming: duration.turnTiming ?? DEFAULT_EFFECT_TURN_TIMING,
  };
}

/**
 * Нормализует части урона в действиях срабатываний. Само действие урона без
 * частей остаётся: его пустоту видно в форме, а VTTG такое действие пропускает.
 *
 * @param triggers срабатывания эффекта.
 * @returns срабатывания с нормализованными частями урона.
 */
function normalizeTriggerDamageParts(
  triggers: EffectTrigger[] | undefined,
): EffectTrigger[] | undefined {
  return triggers?.map((trigger) => ({
    ...trigger,
    actions: trigger.actions.map((action) =>
      action.type === 'damage'
        ? { ...action, parts: normalizeEffectDamageParts(action.parts) ?? [] }
        : action,
    ),
  }));
}

/**
 * Нормализует один активный эффект перед отправкой на сервер:
 * - приводит черновик к записи по месту формы (`normalizeEffectDraft`): Сл не
 *   ниже допустимой, числа из полей — числами, срабатывания без действий не
 *   пишутся;
 * - убирает пустые изменения (без ключа или значения) и пустые флаги;
 * - очищает части урона без формулы, урон каждый ход без частей снимается;
 * - оставляет ровно один исход «при успехе» — его пишет только
 *   `writeEffectSuccessOutcome`.
 *
 * @param effect эффект из формы.
 * @param context место формы.
 * @param layoutOptions что ещё влияет на раскладку.
 * @returns эффект для запроса.
 */
function normalizeActiveEffect(
  effect: ActiveEffect,
  context: EffectFormContext,
  layoutOptions: EffectFormLayoutOptions,
): ActiveEffect {
  const draft = normalizeEffectDraft(
    effect,
    resolveEffectFormLayout(context, effect, layoutOptions),
  );

  // «Даже при успехе» и «только при успехе» вместе не читаются: движок всё
  // равно выбрал бы одно, поэтому наружу уходит ровно один исход.
  const withOutcome =
    draft.applyOnSuccess && draft.applyOnSuccessOnly
      ? writeEffectSuccessOutcome(draft, readEffectSuccessOutcome(draft))
      : draft;

  const changes = normalizeEffectChanges(withOutcome.changes);
  const flags = normalizeEffectFlags(withOutcome.flags);

  const recurringDamageParts = normalizeEffectDamageParts(
    withOutcome.recurringDamage?.damageParts,
  );

  return {
    ...withOutcome,
    description: withOutcome.description.trim(),
    icon: withOutcome.icon?.trim() || undefined,
    duration: normalizeEffectDuration(withOutcome.duration),
    changes,
    flags,
    applyOnSuccess: withOutcome.applyOnSuccess === true ? true : undefined,
    applyOnSuccessOnly:
      withOutcome.applyOnSuccessOnly === true ? true : undefined,
    damageParts: normalizeEffectDamageParts(withOutcome.damageParts),
    recurringDamage:
      withOutcome.recurringDamage && recurringDamageParts
        ? { ...withOutcome.recurringDamage, damageParts: recurringDamageParts }
        : undefined,
    triggers: normalizeTriggerDamageParts(withOutcome.triggers),
    stages: normalizeEffectStages(withOutcome.stages),
  };
}

/**
 * Нормализует массив активных эффектов перед сохранением.
 * Отбрасывает эффекты без названия.
 *
 * @param effects эффекты из формы.
 * @param context место формы: по нему решается, какая Сл допустима и какие
 *   срабатывания пишутся.
 * @param layoutOptions что ещё влияет на раскладку (область у заклинания).
 * @returns эффекты для запроса.
 */
export function normalizeActiveEffects(
  effects: ActiveEffect[] | undefined,
  context: EffectFormContext,
  layoutOptions: EffectFormLayoutOptions = {},
): ActiveEffect[] {
  if (!effects?.length) {
    return [];
  }

  return effects
    .map((effect) => normalizeActiveEffect(effect, context, layoutOptions))
    .filter((effect) => effect.name.length > 0);
}
