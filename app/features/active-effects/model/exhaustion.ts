import type { EffectExhaustionLevel } from './constants';
import type { EffectChange } from './types';

import { EFFECT_EXHAUSTION_LEVELS, MAX_EXHAUSTION_LEVEL } from './constants';

/** Накопленные следствия Истощения на данной ступени (PHB 2014). */
export interface EffectExhaustionSummary {
  /** Ступень, приведённая к 0–6. */
  level: number;
  /** Флаги всех ступеней до данной включительно. */
  flags: string[];
  /** Числовые изменения всех ступеней до данной включительно. */
  changes: EffectChange[];
  /** Описания действующих ступеней по порядку. */
  descriptions: string[];
  /** Существо умерло от Истощения. */
  isDeath: boolean;
}

/**
 * Приводит ступень Истощения к допустимому диапазону 0–6.
 *
 * @param level ступень из данных.
 * @returns целая ступень от 0 до 6.
 */
export function clampExhaustionLevel(level: number): number {
  if (!Number.isFinite(level)) {
    return 0;
  }

  return Math.min(Math.max(Math.trunc(level), 0), MAX_EXHAUSTION_LEVEL);
}

/**
 * Собирает следствия Истощения по таблице PHB 2014: эффекты ступеней
 * накапливаются, поэтому на ступени N действуют все ступени от 1 до N.
 *
 * @param level ступень Истощения.
 * @returns флаги, изменения и описания действующих ступеней.
 */
export function resolveExhaustionEffects(
  level: number,
): EffectExhaustionSummary {
  const clampedLevel = clampExhaustionLevel(level);

  const activeLevels: EffectExhaustionLevel[] = EFFECT_EXHAUSTION_LEVELS.filter(
    (exhaustionLevel) => exhaustionLevel.level <= clampedLevel,
  );

  return {
    level: clampedLevel,
    flags: [
      ...new Set(
        activeLevels.flatMap((exhaustionLevel) => exhaustionLevel.flags),
      ),
    ],
    changes: activeLevels.flatMap((exhaustionLevel) => exhaustionLevel.changes),
    descriptions: activeLevels.map(
      (exhaustionLevel) => exhaustionLevel.description,
    ),
    isDeath: activeLevels.some((exhaustionLevel) => exhaustionLevel.isDeath),
  };
}
