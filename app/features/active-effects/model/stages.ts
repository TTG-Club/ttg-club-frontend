/**
 * Ступени эффекта: «проклятие переходит на следующую ступень».
 *
 * Правила с нарастающей бедой описывают ступени словами, а переводит на
 * следующую — человек. Конвейер листа VTTG о ступенях не знает вовсе: перевод
 * ПЕРЕПИСЫВАЕТ `changes` и `flags` самого эффекта из ступени. Поэтому и форма
 * держит строки эффекта равными действующей ступени — иначе правка ступени ни
 * на что не влияла бы.
 *
 * Перевод на следующую ступень — дело VTTG, здесь его нет.
 *
 * Зеркало: dnd5-test-migrate/src/engine/effectStages.ts
 */

import type { ActiveEffect, EffectStage } from './types';

/** Первая ступень — у эффекта без поля `stageIndex`. */
export const FIRST_EFFECT_STAGE_INDEX = 0;

/**
 * Номер действующей ступени, приведённый к списку.
 *
 * @param effect эффект.
 * @returns номер ступени; 0, если ступеней нет.
 */
export function resolveEffectStageIndex(
  effect: Pick<ActiveEffect, 'stages' | 'stageIndex'>,
): number {
  const total = effect.stages?.length ?? 0;

  if (total === 0) {
    return FIRST_EFFECT_STAGE_INDEX;
  }

  const index = effect.stageIndex ?? FIRST_EFFECT_STAGE_INDEX;

  return Math.min(Math.max(index, FIRST_EFFECT_STAGE_INDEX), total - 1);
}

/**
 * Действующая ступень эффекта.
 *
 * @param effect эффект.
 * @returns ступень либо `null`, если ступеней нет.
 */
export function resolveEffectStage(
  effect: Pick<ActiveEffect, 'stages' | 'stageIndex'>,
): EffectStage | null {
  return effect.stages?.[resolveEffectStageIndex(effect)] ?? null;
}

/**
 * Переносит строки и флаги эффекта в его действующую ступень. При заведённых
 * ступенях строки эффекта — это строки действующей ступени: сохранение
 * перепишет их из неё (`applyEffectStage`), и правка одних только строк
 * эффекта молча пропала бы.
 *
 * @param effect эффект с новыми строками или флагами.
 * @returns эффект, у которого действующая ступень совпадает со строками, либо
 *   он сам, если ступеней нет.
 */
export function writeActiveEffectStageRows(effect: ActiveEffect): ActiveEffect {
  const { stages } = effect;

  if (!stages?.length) {
    return effect;
  }

  const activeIndex = resolveEffectStageIndex(effect);

  return {
    ...effect,
    stages: stages.map((stage, stageIndex) =>
      stageIndex === activeIndex
        ? { ...stage, changes: [...effect.changes], flags: [...effect.flags] }
        : stage,
    ),
  };
}

/**
 * Приводит эффект к его действующей ступени: номер и её `changes` и `flags`.
 * Копии списков — ступень остаётся в эффекте, и правка строк не должна задеть
 * её.
 *
 * @param effect эффект.
 * @returns эффект со значениями ступени либо он сам, если ступеней нет.
 */
export function applyEffectStage(effect: ActiveEffect): ActiveEffect {
  const stage = resolveEffectStage(effect);

  return stage
    ? {
        ...effect,
        stageIndex: resolveEffectStageIndex(effect),
        changes: [...stage.changes],
        flags: [...stage.flags],
      }
    : effect;
}
