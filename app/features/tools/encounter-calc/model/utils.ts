import type {
  CustomCreatureDraft,
  EncounterBudgetSegment,
  EncounterCreature,
  EncounterCreatureOption,
  EncounterDifficulty,
  EncounterPartyRow,
  EncounterResult,
  EncounterSelectItem,
  EncounterThresholds,
  EncounterTransferBatch,
} from './types';

import {
  CUSTOM_CREATURE_DEFAULT_NAME,
  CUSTOM_CREATURE_LABELS,
  DAILY_EXPERIENCE_BY_LEVEL,
  EMPTY_THRESHOLDS,
  ENCOUNTER_MULTIPLIERS,
  EXPERIENCE_BY_CHALLENGE_RATING,
  EXPERIENCE_THRESHOLDS_BY_LEVEL,
  LARGE_PARTY_MIN_SIZE,
  MAX_CHARACTER_LEVEL,
  MIN_CHARACTER_LEVEL,
  MULTIPLIER_STEP_MIN_COUNTS,
  NUMBER_LOCALE,
  SMALL_PARTY_MAX_SIZE,
  THRESHOLD_DIFFICULTIES,
} from './constants';

/**
 * Индекс строки таблицы по уровню: уровень вне диапазона 1–20 прижимается к
 * ближайшей границе.
 * @param level Уровень персонажа.
 */
function getLevelIndex(level: number): number {
  return (
    Math.min(
      MAX_CHARACTER_LEVEL,
      Math.max(MIN_CHARACTER_LEVEL, Math.trunc(level)),
    ) - 1
  );
}

/**
 * Пороги опыта одного персонажа по уровню (DMG 2014).
 * @param level Уровень персонажа.
 */
export function getCharacterThresholds(level: number): EncounterThresholds {
  return (
    EXPERIENCE_THRESHOLDS_BY_LEVEL[getLevelIndex(level)] ?? EMPTY_THRESHOLDS
  );
}

/**
 * Складывает пороги всех персонажей группы.
 * @param party Строки группы: уровень и число персонажей.
 */
export function getPartyThresholds(
  party: ReadonlyArray<EncounterPartyRow>,
): EncounterThresholds {
  return party.reduce<EncounterThresholds>((total, row) => {
    const thresholds = getCharacterThresholds(row.level);

    return {
      easy: total.easy + thresholds.easy * row.count,
      medium: total.medium + thresholds.medium * row.count,
      hard: total.hard + thresholds.hard * row.count,
      deadly: total.deadly + thresholds.deadly * row.count,
    };
  }, EMPTY_THRESHOLDS);
}

/**
 * Бюджет скорректированного опыта группы на день приключений.
 * @param party Строки группы.
 */
export function getPartyDailyBudget(
  party: ReadonlyArray<EncounterPartyRow>,
): number {
  return party.reduce(
    (total, row) =>
      total
      + (DAILY_EXPERIENCE_BY_LEVEL[getLevelIndex(row.level)] ?? 0) * row.count,
    0,
  );
}

/**
 * Множитель опыта за число существ с поправкой на размер группы (DMG 2014):
 * группе меньше трёх персонажей — следующий множитель шкалы, группе из
 * шести и больше — предыдущий. Без существ множитель единица.
 * @param creatureCount Число существ в столкновении.
 * @param characterCount Число персонажей в группе.
 */
export function getEncounterMultiplier(
  creatureCount: number,
  characterCount: number,
): number {
  if (creatureCount <= 0) {
    return 1;
  }

  const step = MULTIPLIER_STEP_MIN_COUNTS.filter(
    (minCount) => creatureCount >= minCount,
  ).length;

  let shift = 0;

  if (characterCount > 0 && characterCount <= SMALL_PARTY_MAX_SIZE) {
    shift = 1;
  } else if (characterCount >= LARGE_PARTY_MIN_SIZE) {
    shift = -1;
  }

  const index = Math.min(
    ENCOUNTER_MULTIPLIERS.length - 1,
    Math.max(0, step + shift),
  );

  return ENCOUNTER_MULTIPLIERS[index] ?? 1;
}

/**
 * Скорректированный опыт: суммарный опыт, умноженный на множитель за число
 * существ.
 * @param experience Суммарный опыт существ.
 * @param creatureCount Число существ.
 * @param characterCount Число персонажей.
 */
export function getAdjustedExperience(
  experience: number,
  creatureCount: number,
  characterCount: number,
): number {
  return Math.floor(
    experience * getEncounterMultiplier(creatureCount, characterCount),
  );
}

/**
 * Опыт существа по уровню опасности; неизвестный уровень опасности даёт `0`.
 * @param challengeRating Уровень опасности строкой («1/4», «5»).
 */
export function getExperienceByChallengeRating(
  challengeRating: string,
): number {
  return EXPERIENCE_BY_CHALLENGE_RATING[challengeRating.trim()] ?? 0;
}

/**
 * Пункты выбора уровня опасности — все уровни таблицы опыта по порядку
 * (0, 1/8, 1/4, 1/2, 1 … 30) с опытом в подписи.
 */
export function getChallengeRatingItems(): Array<EncounterSelectItem> {
  return Object.entries(EXPERIENCE_BY_CHALLENGE_RATING)
    .sort(([, left], [, right]) => left - right)
    .map(([challengeRating, experience]) => ({
      value: challengeRating,
      label: `${challengeRating} · ${formatExperience(experience)} ${CUSTOM_CREATURE_LABELS.experienceUnit}`,
    }));
}

/**
 * Уровни опасности, опыт которых не больше заданного, — ими генератор
 * фильтрует бестиарий.
 * @param maxExperience Наибольший допустимый опыт одного существа.
 */
export function getAffordableChallengeRatings(
  maxExperience: number,
): Array<string> {
  return Object.entries(EXPERIENCE_BY_CHALLENGE_RATING)
    .filter(([, experience]) => experience <= maxExperience)
    .map(([challengeRating]) => challengeRating);
}

/**
 * Свой ли это монстр мастера, а не существо из бестиария.
 * @param creature Существо столкновения.
 */
export function isCustomCreature(creature: EncounterCreature): boolean {
  return creature.url === undefined;
}

/**
 * Название своего монстра: введённое без пробелов по краям или название по
 * умолчанию.
 * @param name Введённое название.
 */
export function getCustomCreatureName(name: string): string {
  return name.trim() || CUSTOM_CREATURE_DEFAULT_NAME;
}

/**
 * Находит строку своего монстра с тем же названием и уровнем опасности,
 * чтобы прибавить к ней количество вместо новой строки.
 * @param creatures Существа столкновения.
 * @param draft Что ввёл мастер.
 */
export function findCustomCreature(
  creatures: ReadonlyArray<EncounterCreature>,
  draft: CustomCreatureDraft,
): EncounterCreature | undefined {
  const name = getCustomCreatureName(draft.name);

  return creatures.find(
    (creature) =>
      isCustomCreature(creature)
      && creature.name === name
      && creature.challengeRating === draft.challengeRating,
  );
}

/**
 * Строит строку своего монстра: опыт берётся по уровню опасности из той же
 * таблицы, что и у существ бестиария.
 * @param id Идентификатор строки.
 * @param draft Что ввёл мастер.
 */
export function createCustomCreature(
  id: string,
  draft: CustomCreatureDraft,
): EncounterCreature {
  return {
    id,
    name: getCustomCreatureName(draft.name),
    type: '',
    challengeRating: draft.challengeRating,
    experience: getExperienceByChallengeRating(draft.challengeRating),
    count: draft.count,
  };
}

/**
 * Строит строку существа бестиария.
 * @param id Идентификатор строки.
 * @param option Существо из поиска или генератора.
 * @param count Сколько таких существ.
 */
export function createBestiaryCreature(
  id: string,
  option: EncounterCreatureOption,
  count: number,
): EncounterCreature {
  return {
    id,
    url: option.url,
    name: option.label,
    type: option.type,
    challengeRating: option.challengeRating,
    experience: option.experience,
    count,
  };
}

/**
 * Сколько своих монстров в столкновении — их в трекер не перенести.
 * @param creatures Существа столкновения.
 */
export function countCustomCreatures(
  creatures: ReadonlyArray<EncounterCreature>,
): number {
  return creatures.reduce(
    (total, creature) =>
      isCustomCreature(creature) ? total + creature.count : total,
    0,
  );
}

/**
 * Определяет сложность по скорректированному опыту: достигнут порог —
 * достигнута сложность; не дотянули до лёгкой — `trivial`.
 * @param adjustedExperience Скорректированный опыт.
 * @param thresholds Пороги группы.
 */
export function getEncounterDifficulty(
  adjustedExperience: number,
  thresholds: EncounterThresholds,
): EncounterDifficulty {
  if (adjustedExperience <= 0 || thresholds.deadly <= 0) {
    return 'none';
  }

  return (
    THRESHOLD_DIFFICULTIES.findLast(
      (difficulty) => adjustedExperience >= thresholds[difficulty],
    ) ?? 'trivial'
  );
}

/**
 * Считает столкновение по правилам DMG 2014: пороги группы — сумма порогов
 * персонажей, опыт существ умножается на множитель за их число с поправкой
 * на размер группы. Опыт за победу — без множителя.
 * @param party Строки группы.
 * @param creatures Существа столкновения.
 */
export function calculateEncounter(
  party: ReadonlyArray<EncounterPartyRow>,
  creatures: ReadonlyArray<EncounterCreature>,
): EncounterResult {
  const thresholds = getPartyThresholds(party);
  const characterCount = party.reduce((total, row) => total + row.count, 0);

  const creatureCount = creatures.reduce(
    (total, creature) => total + creature.count,
    0,
  );

  const totalExperience = creatures.reduce(
    (total, creature) => total + creature.experience * creature.count,
    0,
  );

  const adjustedExperience = getAdjustedExperience(
    totalExperience,
    creatureCount,
    characterCount,
  );

  return {
    thresholds,
    totalExperience,
    adjustedExperience,
    multiplier: getEncounterMultiplier(creatureCount, characterCount),
    creatureCount,
    characterCount,
    experiencePerCharacter:
      characterCount > 0 ? Math.floor(totalExperience / characterCount) : 0,
    dailyBudget: getPartyDailyBudget(party),
    difficulty: getEncounterDifficulty(adjustedExperience, thresholds),
  };
}

/**
 * Делит шкалу на четыре отрезка между порогами (до лёгкой, до средней, до
 * сложной, до смертельной) и считает, насколько каждый заполнен
 * скорректированным опытом. Вся шкала — порог смертельной сложности. Без
 * группы отрезки делят шкалу поровну, чтобы подписи не слипались.
 * @param adjustedExperience Скорректированный опыт.
 * @param thresholds Пороги группы.
 */
export function getBudgetSegments(
  adjustedExperience: number,
  thresholds: EncounterThresholds,
): Array<EncounterBudgetSegment> {
  const zones: Array<{
    difficulty: EncounterBudgetSegment['difficulty'];
    threshold: EncounterBudgetSegment['threshold'];
    start: number;
  }> = [
    { difficulty: 'trivial', threshold: 'easy', start: 0 },
    { difficulty: 'easy', threshold: 'medium', start: thresholds.easy },
    { difficulty: 'medium', threshold: 'hard', start: thresholds.medium },
    { difficulty: 'hard', threshold: 'deadly', start: thresholds.hard },
  ];

  return zones.map(({ difficulty, threshold, start }) => {
    const size = thresholds[threshold] - start;

    return {
      difficulty,
      threshold,
      width:
        thresholds.deadly > 0 ? size / thresholds.deadly : 1 / zones.length,
      fill:
        size > 0
          ? Math.min(1, Math.max(0, (adjustedExperience - start) / size))
          : 0,
    };
  });
}

/**
 * Пачки существ для трекера инициативы: одно существо — один запрос
 * добавления. Порядок — как в калькуляторе. Свои монстры пропускаются:
 * трекер добавляет существ только из бестиария.
 * @param creatures Существа калькулятора.
 */
export function getTransferBatches(
  creatures: ReadonlyArray<EncounterCreature>,
): Array<EncounterTransferBatch> {
  const counts = new Map<string, number>();

  creatures.forEach(({ url, count }) => {
    if (url === undefined) {
      return;
    }

    counts.set(url, (counts.get(url) ?? 0) + count);
  });

  return [...counts].map(([creatureUrl, count]) => ({ creatureUrl, count }));
}

/**
 * Число опыта для показа: с пробелами между тысячами.
 * @param experience Опыт.
 */
export function formatExperience(experience: number): string {
  return experience.toLocaleString(NUMBER_LOCALE);
}

/**
 * Множитель для показа: «×1,5».
 * @param multiplier Множитель.
 */
export function formatMultiplier(multiplier: number): string {
  return `×${multiplier.toLocaleString(NUMBER_LOCALE)}`;
}

/**
 * Подпись шкалы для экранных читалок: какая доля порога смертельной
 * сложности уже набрана.
 * @param adjustedExperience Скорректированный опыт.
 * @param thresholds Пороги группы.
 */
export function getBudgetSpentLabel(
  adjustedExperience: number,
  thresholds: EncounterThresholds,
): string {
  const percent =
    thresholds.deadly > 0
      ? Math.round((adjustedExperience / thresholds.deadly) * 100)
      : 0;

  return `Набрано ${percent}% порога смертельной сложности`;
}
