import type {
  EncounterCreature,
  EncounterCreatureOption,
  GenerationContext,
} from '~tools/encounter-calc/model';

import { describe, expect, it } from 'vitest';

import {
  calculateEncounter,
  DEFAULT_ENCOUNTER_STATE,
  generateCreatures,
  getAdjustedExperience,
  getAffordableChallengeRatings,
  getBudgetSegments,
  getEncounterDifficulty,
  getEncounterMultiplier,
  getEncounterTableTier,
  getGenerationWindow,
  getMaxCandidateExperience,
  getPartyThresholds,
  getTransferBatches,
  parseCreatureOptions,
  parseEncounterState,
  parseTableCreature,
  parseTableCreatureGroups,
  rollQuantity,
  rollTableCreatures,
} from '~tools/encounter-calc/model';

/**
 * Строка существа для расчёта.
 * @param experience Опыт за одно существо.
 * @param count Сколько существ.
 * @param url Адрес в бестиарии; нет — свой монстр.
 */
function makeCreature(
  experience: number,
  count: number,
  url?: string,
): EncounterCreature {
  return {
    id: `${url ?? 'custom'}-${experience}`,
    url,
    name: 'Существо',
    type: '',
    challengeRating: '1',
    experience,
    count,
  };
}

/**
 * Кандидат генератора.
 * @param url Адрес в бестиарии.
 * @param experience Опыт.
 * @param type Тип существа.
 */
function makeOption(
  url: string,
  experience: number,
  type = 'гуманоид',
): EncounterCreatureOption {
  return { url, label: url, type, challengeRating: '1', experience };
}

/**
 * Предсказуемый генератор случайных чисел (линейный конгруэнтный).
 * @param seed Начальное значение.
 */
function seededRandom(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;

    return state / 4_294_967_296;
  };
}

describe('пороги группы (DMG 2014)', () => {
  it('складывает пороги персонажей разных уровней', () => {
    expect(
      getPartyThresholds([
        { id: 'a', level: 3, count: 3 },
        { id: 'b', level: 2, count: 1 },
      ]),
    ).toEqual({ easy: 275, medium: 550, hard: 825, deadly: 1_400 });
  });

  it('прижимает уровень к диапазону 1–20', () => {
    expect(getPartyThresholds([{ id: 'a', level: 25, count: 1 }])).toEqual({
      easy: 2_800,
      medium: 5_700,
      hard: 8_500,
      deadly: 12_700,
    });
  });
});

describe('множитель за число существ', () => {
  it.each([
    [1, 1],
    [2, 1.5],
    [3, 2],
    [6, 2],
    [7, 2.5],
    [10, 2.5],
    [11, 3],
    [14, 3],
    [15, 4],
    [30, 4],
  ])('%i существ против 4 персонажей — ×%f', (creatures, multiplier) => {
    expect(getEncounterMultiplier(creatures, 4)).toBe(multiplier);
  });

  it('маленькая группа берёт следующий множитель', () => {
    expect(getEncounterMultiplier(1, 2)).toBe(1.5);
    expect(getEncounterMultiplier(15, 1)).toBe(5);
  });

  it('большая группа берёт предыдущий множитель', () => {
    expect(getEncounterMultiplier(1, 6)).toBe(0.5);
    expect(getEncounterMultiplier(3, 7)).toBe(1.5);
  });

  it('без существ множитель единица', () => {
    expect(getEncounterMultiplier(0, 4)).toBe(1);
  });
});

describe('расчёт столкновения', () => {
  it('пример из «Руководства мастера»: 4 персонажа 3 уровня против 4 существ', () => {
    // 4 × 100 опыта = 400, множитель ×2 — 800: порог средней (600) взят,
    // сложной (900) — нет.
    const result = calculateEncounter(
      [{ id: 'a', level: 3, count: 4 }],
      [makeCreature(100, 4, '/bestiary/orc')],
    );

    expect(result.totalExperience).toBe(400);
    expect(result.adjustedExperience).toBe(800);
    expect(result.multiplier).toBe(2);
    expect(result.difficulty).toBe('medium');
    expect(result.experiencePerCharacter).toBe(100);
    expect(result.dailyBudget).toBe(4_800);
  });

  it('сложность определяется достижением порога', () => {
    const thresholds = { easy: 100, medium: 200, hard: 300, deadly: 400 };

    expect(getEncounterDifficulty(0, thresholds)).toBe('none');
    expect(getEncounterDifficulty(99, thresholds)).toBe('trivial');
    expect(getEncounterDifficulty(100, thresholds)).toBe('easy');
    expect(getEncounterDifficulty(299, thresholds)).toBe('medium');
    expect(getEncounterDifficulty(400, thresholds)).toBe('deadly');
    expect(getEncounterDifficulty(5_000, thresholds)).toBe('deadly');
  });

  it('без группы сложности нет', () => {
    expect(calculateEncounter([], [makeCreature(200, 1)]).difficulty).toBe(
      'none',
    );
  });
});

describe('шкала сложности', () => {
  it('делит шкалу по порогам и заполняет отрезки', () => {
    const segments = getBudgetSegments(250, {
      easy: 100,
      medium: 200,
      hard: 300,
      deadly: 400,
    });

    expect(segments.map(({ width }) => width)).toEqual([
      0.25, 0.25, 0.25, 0.25,
    ]);

    expect(segments.map(({ fill }) => fill)).toEqual([1, 1, 0.5, 0]);
  });
});

describe('генератор', () => {
  const thresholds = { easy: 300, medium: 600, hard: 900, deadly: 1_600 };

  it('окно сложности — от её порога до следующего', () => {
    expect(getGenerationWindow('medium', thresholds, 0)).toEqual({
      min: 600,
      max: 899,
    });

    expect(getGenerationWindow('deadly', thresholds, 0)).toEqual({
      min: 1_600,
      max: 2_400,
    });
  });

  it('уже сложное столкновение не добирает до лёгкой', () => {
    expect(getGenerationWindow('easy', thresholds, 700)).toBeNull();
  });

  it('уровни опасности по наибольшему опыту существа', () => {
    expect(getAffordableChallengeRatings(100)).toEqual([
      '0',
      '1/8',
      '1/4',
      '1/2',
    ]);
  });

  it('учитывает уже добавленных существ в границе кандидата', () => {
    const context: GenerationContext = {
      window: { min: 600, max: 899 },
      baseExperience: 200,
      baseCount: 1,
      characterCount: 4,
      creatureLimit: 8,
    };

    // Второе существо даёт ×1,5: 899 / 1,5 = 599, минус уже набранные 200.
    expect(getMaxCandidateExperience(context)).toBe(399);
  });

  it('попадает в окно скорректированного опыта', () => {
    const candidates = [
      makeOption('/bestiary/goblin', 50),
      makeOption('/bestiary/hobgoblin', 100),
      makeOption('/bestiary/bugbear', 200),
      makeOption('/bestiary/wolf', 50, 'зверь'),
    ];

    const context: GenerationContext = {
      window: { min: 600, max: 899 },
      baseExperience: 0,
      baseCount: 0,
      characterCount: 4,
      creatureLimit: 8,
    };

    for (let seed = 1; seed <= 20; seed += 1) {
      const picks = generateCreatures(candidates, context, seededRandom(seed));
      const count = picks.reduce((sum, pick) => sum + pick.count, 0);

      const experience = picks.reduce(
        (sum, pick) => sum + pick.candidate.experience * pick.count,
        0,
      );

      const adjusted = getAdjustedExperience(experience, count, 4);

      expect(adjusted).toBeGreaterThanOrEqual(600);
      expect(adjusted).toBeLessThanOrEqual(899);
      expect(count).toBeLessThanOrEqual(8);
    }
  });

  it('без подходящих кандидатов ничего не добавляет', () => {
    const context: GenerationContext = {
      window: { min: 600, max: 899 },
      baseExperience: 0,
      baseCount: 0,
      characterCount: 4,
      creatureLimit: 8,
    };

    expect(
      generateCreatures([makeOption('/bestiary/dragon', 5_000)], context),
    ).toEqual([]);
  });
});

describe('разбор данных', () => {
  it('берёт опыт существа из списка бестиария по уровню опасности', () => {
    expect(
      parseCreatureOptions([
        {
          name: { rus: 'Гоблин', eng: 'Goblin' },
          type: 'гуманоид',
          challengeRating: '1/4',
          url: '/bestiary/goblin',
        },
        {
          name: { rus: 'Неизвестный', eng: 'Unknown' },
          type: 'монстр',
          challengeRating: '—',
          url: '/bestiary/unknown',
        },
      ]),
    ).toEqual([
      {
        url: '/bestiary/goblin',
        label: 'Гоблин',
        type: 'гуманоид',
        challengeRating: '1/4',
        experience: 50,
      },
      {
        url: '/bestiary/unknown',
        label: 'Неизвестный',
        type: 'монстр',
        challengeRating: '—',
        experience: 0,
      },
    ]);
  });

  it('битое состояние даёт начальное', () => {
    expect(parseEncounterState({ party: 'oops' })).toEqual(
      DEFAULT_ENCOUNTER_STATE,
    );
  });

  it('пачки для трекера объединяют одно существо и пропускают своих', () => {
    expect(
      getTransferBatches([
        makeCreature(50, 2, '/bestiary/goblin'),
        makeCreature(200, 1),
      ]),
    ).toEqual([{ creatureUrl: '/bestiary/goblin', count: 2 }]);
  });
});

describe('таблицы случайных столкновений', () => {
  const link = (slug: string, label: string): string =>
    `<detail-tooltip type="creature"><a href="/bestiary/${slug}">${label}</a></detail-tooltip>`;

  const dice = (formula: string): string =>
    `<dice-roller formula="${formula}">${formula}</dice-roller>`;

  it('диапазон таблицы по среднему уровню группы', () => {
    expect(getEncounterTableTier([{ id: 'a', level: 3, count: 4 }])).toBe(1);
    expect(getEncounterTableTier([{ id: 'a', level: 5, count: 4 }])).toBe(2);
    expect(getEncounterTableTier([{ id: 'a', level: 16, count: 1 }])).toBe(3);
    expect(getEncounterTableTier([{ id: 'a', level: 20, count: 1 }])).toBe(4);
    expect(getEncounterTableTier([])).toBe(1);
  });

  it('берёт кубики и числа перед ссылками на существ', () => {
    expect(
      parseTableCreatureGroups(
        `1 ${link('orc_eye_of_gruumsh', 'орк')} и ${dice('1d3')} ${link('Orog', 'орогов')}`,
      ),
    ).toEqual([
      { slug: 'orc_eye_of_gruumsh', quantity: '1' },
      { slug: 'Orog', quantity: '1d3' },
    ]);
  });

  it('пропускает слова и скобку между количеством и существом', () => {
    expect(
      parseTableCreatureGroups(
        `<p>${dice('2d8')} охотников (${link('Tribal_warrior', 'воителей')})</p>`,
      ),
    ).toEqual([{ slug: 'Tribal_warrior', quantity: '2d8' }]);
  });

  it('без количества — одно существо', () => {
    expect(parseTableCreatureGroups(link('couatl', 'коатль'))).toEqual([
      { slug: 'couatl', quantity: '1' },
    ]);
  });

  it('бросает формулы с бонусом', () => {
    expect(rollQuantity('1d6+2', () => 0)).toBe(3);
    expect(rollQuantity('2d4', () => 0.99)).toBe(8);
    expect(rollQuantity('1d4 - 3', () => 0)).toBe(1);
    expect(rollQuantity('3')).toBe(3);
  });

  it('выбирает один вариант из «или» и складывает одинаковых', () => {
    const html = `${dice('2d4')} ${link('ape', 'обезьян')} или 1 ${link('Goblin', 'гоблин')} и 2 ${link('goblin', 'гоблина')}`;

    expect(rollTableCreatures(html, () => 0)).toEqual([
      { slug: 'ape', count: 2 },
    ]);

    expect(rollTableCreatures(html, () => 0.99)).toEqual([
      { slug: 'goblin', count: 3 },
    ]);
  });

  it('событие без существ ничего не даёт', () => {
    expect(
      rollTableCreatures('Старое дерево с вырезанным в стволе лицом'),
    ).toEqual([]);
  });

  it('берёт опыт из статьи бестиария, без него — по уровню опасности', () => {
    expect(
      parseTableCreature({
        url: '/bestiary/orog',
        name: { rus: 'Орог', eng: 'Orog' },
        type: { name: 'гуманоид' },
        challengeRating: '2',
        experience: 450,
      }),
    ).toEqual({
      url: '/bestiary/orog',
      label: 'Орог',
      type: 'гуманоид',
      challengeRating: '2',
      experience: 450,
    });

    expect(
      parseTableCreature({
        url: '/bestiary/goblin',
        name: { rus: 'Гоблин' },
        challengeRating: '1/4',
      }).experience,
    ).toBe(50);
  });
});
