import type {
  EncounterCreatureOption,
  EncounterThresholds,
  GeneratedCreature,
  GenerationAttempt,
  GenerationContext,
  GenerationDifficulty,
  GenerationWindow,
  RandomSource,
  RetinueOption,
} from './types';

import {
  GENERATION_ATTEMPTS,
  GENERATION_CREATURES_PER_CHARACTER,
  GENERATION_DEADLY_CAP_RATIO,
  GENERATION_LEADER_RATIO,
  GENERATION_MAX_CREATURES,
  GENERATION_MAX_KINDS,
  GENERATION_MIN_CREATURES,
  GENERATION_REPEAT_CHANCE,
  GENERATION_STOP_CHANCE,
  THRESHOLD_DIFFICULTIES,
} from './constants';
import { getAdjustedExperience, getEncounterMultiplier } from './utils';

/**
 * Диапазон скорректированного опыта, в который должно попасть столкновение
 * целевой сложности: от её порога до порога следующей (не включая его). Для
 * смертельной верхняя граница — доля её порога.
 * @param difficulty Целевая сложность.
 * @param thresholds Пороги группы.
 * @param currentAdjusted Скорректированный опыт уже добавленных существ.
 * @returns Диапазон либо `null`, если столкновение уже сложнее целевой.
 */
export function getGenerationWindow(
  difficulty: GenerationDifficulty,
  thresholds: EncounterThresholds,
  currentAdjusted: number,
): GenerationWindow | null {
  const next =
    THRESHOLD_DIFFICULTIES[THRESHOLD_DIFFICULTIES.indexOf(difficulty) + 1];

  const max = next
    ? thresholds[next] - 1
    : Math.floor(thresholds.deadly * GENERATION_DEADLY_CAP_RATIO);

  if (thresholds.deadly <= 0 || currentAdjusted >= max) {
    return null;
  }

  return { min: thresholds[difficulty], max };
}

/**
 * Наибольший опыт, который может принести одно новое существо: множитель
 * следующего существа не меньше текущего, поэтому существа дороже этого
 * в окно заведомо не влезут.
 * @param context Что уже есть в столкновении и куда надо попасть.
 */
export function getMaxCandidateExperience(context: GenerationContext): number {
  const multiplier = getEncounterMultiplier(
    context.baseCount + 1,
    context.characterCount,
  );

  return Math.max(
    0,
    Math.floor(context.window.max / multiplier) - context.baseExperience,
  );
}

/**
 * Сколько существ генератор может положить в столкновение: по два на
 * персонажа, но не меньше и не больше заданных пределов.
 * @param characterCount Число персонажей в группе.
 */
export function getGenerationCreatureLimit(characterCount: number): number {
  return Math.min(
    GENERATION_MAX_CREATURES,
    Math.max(
      GENERATION_MIN_CREATURES,
      characterCount * GENERATION_CREATURES_PER_CHARACTER,
    ),
  );
}

/**
 * Случайный элемент массива.
 * @param choices Массив вариантов.
 * @param random Источник случайных чисел.
 */
function pickRandom<T>(
  choices: ReadonlyArray<T>,
  random: RandomSource,
): T | undefined {
  return choices[Math.floor(random() * choices.length)];
}

/**
 * Случайный кандидат свиты с учётом весов.
 * @param options Кандидаты с положительными весами.
 * @param random Источник случайных чисел.
 */
function pickWeighted(
  options: ReadonlyArray<RetinueOption>,
  random: RandomSource,
): EncounterCreatureOption | undefined {
  const total = options.reduce((sum, { weight }) => sum + weight, 0);

  let roll = random() * total;

  for (const { candidate, weight } of options) {
    roll -= weight;

    if (roll < 0) {
      return candidate;
    }
  }

  return options.at(-1)?.candidate;
}

/**
 * Свита главаря: существа не сильнее его. Список бестиария редакции 2014
 * знает о существе только тип, поэтому тематической считается свита того же
 * типа (гуманоиды с гуманоидом, нежить с нежитью). Если таких нет, годится
 * любое существо — группа выйдет без общей темы, зато сложность будет
 * достигнута.
 * @param pool Кандидаты, каждый из которых умещается в окно.
 * @param leader Главарь группы.
 * @returns Свита и признак, что она тематическая.
 */
function getRetinue(
  pool: ReadonlyArray<EncounterCreatureOption>,
  leader: EncounterCreatureOption,
): { options: Array<RetinueOption>; isThemed: boolean } {
  const weaker = pool.filter(
    (candidate) =>
      candidate.url !== leader.url && candidate.experience <= leader.experience,
  );

  const themed = leader.type
    ? weaker.filter((candidate) => candidate.type === leader.type)
    : [];

  if (themed.length) {
    return {
      options: themed.map((candidate) => ({ candidate, weight: 1 })),
      isThemed: true,
    };
  }

  return {
    options: weaker.map((candidate) => ({ candidate, weight: 1 })),
    isThemed: false,
  };
}

/**
 * Добавляет существо в итог попытки: повтор увеличивает счётчик, новое
 * существо — новую строку.
 * @param picks Уже выбранные существа.
 * @param next Добавляемое существо.
 */
function addPick(
  picks: Array<GeneratedCreature>,
  next: EncounterCreatureOption,
): Array<GeneratedCreature> {
  return picks.some(({ candidate }) => candidate.url === next.url)
    ? picks.map((pick) =>
        pick.candidate.url === next.url
          ? { ...pick, count: pick.count + 1 }
          : pick,
      )
    : [...picks, { candidate: next, count: 1 }];
}

/**
 * Одна попытка: сначала «главарь» заметной силы, затем свита — чаще копии
 * уже выбранных существ, реже новые того же типа, пока скорректированный
 * опыт не попадёт в окно и не сработает случайная остановка либо пока
 * следующее существо не выводит за верхнюю границу. Каждое новое существо
 * может поднять множитель, поэтому влезает ли оно, проверяется по
 * скорректированному опыту всего столкновения.
 * @param pool Кандидаты, каждый из которых в одиночку умещается в окно.
 * @param context Что уже есть в столкновении и куда надо попасть.
 * @param random Источник случайных чисел.
 */
function runAttempt(
  pool: ReadonlyArray<EncounterCreatureOption>,
  context: GenerationContext,
  random: RandomSource,
): GenerationAttempt {
  const { window, baseExperience, baseCount, characterCount, creatureLimit } =
    context;

  const getAdjusted = (experience: number, count: number): number =>
    getAdjustedExperience(
      baseExperience + experience,
      baseCount + count,
      characterCount,
    );

  const leaderFloor =
    getMaxCandidateExperience(context) * GENERATION_LEADER_RATIO;

  const leaders = pool.filter(({ experience }) => experience >= leaderFloor);
  const leader = pickRandom(leaders.length ? leaders : pool, random);

  if (!leader) {
    return { picks: [], adjusted: 0, isThemed: false };
  }

  const retinue = getRetinue(pool, leader);

  let picks: Array<GeneratedCreature> = [{ candidate: leader, count: 1 }];
  let total = leader.experience;
  let count = 1;

  while (count < creatureLimit) {
    if (
      getAdjusted(total, count) >= window.min
      && random() < GENERATION_STOP_CHANCE
    ) {
      break;
    }

    const fits = (candidate: EncounterCreatureOption): boolean =>
      getAdjusted(total + candidate.experience, count + 1) <= window.max;

    const repeatable = picks.filter(({ candidate }) => fits(candidate));

    const newcomers =
      picks.length < GENERATION_MAX_KINDS
        ? retinue.options.filter(
            (option) =>
              fits(option.candidate)
              && !picks.some(
                ({ candidate }) => candidate.url === option.candidate.url,
              ),
          )
        : [];

    const shouldRepeat =
      repeatable.length > 0
      && (newcomers.length === 0 || random() < GENERATION_REPEAT_CHANCE);

    const next = shouldRepeat
      ? pickRandom(repeatable, random)?.candidate
      : pickWeighted(newcomers, random);

    if (!next) {
      break;
    }

    picks = addPick(picks, next);
    total += next.experience;
    count += 1;
  }

  return {
    picks,
    adjusted: getAdjusted(total, count),
    // Группа из одного вида (три огра) тоже тематическая.
    isThemed: retinue.isThemed || picks.length === 1,
  };
}

/**
 * Подбирает случайных существ так, чтобы скорректированный опыт всего
 * столкновения попал в окно. Делает несколько попыток и берёт первую удачную
 * с тематической свитой; если таких нет — первую удачную, а если нет и их —
 * попытку с наибольшим опытом (он всегда не больше верхней границы).
 * @param candidates Существа бестиария с известным опытом.
 * @param context Что уже есть в столкновении и куда надо попасть.
 * @param random Источник случайных чисел.
 * @returns Существа с количествами; пустой массив — подобрать некого.
 */
export function generateCreatures(
  candidates: ReadonlyArray<EncounterCreatureOption>,
  context: GenerationContext,
  random: RandomSource = Math.random,
): Array<GeneratedCreature> {
  const pool = candidates.filter(
    ({ experience }) =>
      experience > 0
      && getAdjustedExperience(
        context.baseExperience + experience,
        context.baseCount + 1,
        context.characterCount,
      ) <= context.window.max,
  );

  if (!pool.length || context.creatureLimit < 1) {
    return [];
  }

  let fallback: GenerationAttempt | undefined;
  let best: GenerationAttempt = { picks: [], adjusted: 0, isThemed: false };

  for (let attempt = 0; attempt < GENERATION_ATTEMPTS; attempt += 1) {
    const result = runAttempt(pool, context, random);

    if (result.adjusted >= context.window.min) {
      if (result.isThemed) {
        return result.picks;
      }

      fallback ??= result;
    }

    if (result.adjusted > best.adjusted) {
      best = result;
    }
  }

  return (fallback ?? best).picks;
}
