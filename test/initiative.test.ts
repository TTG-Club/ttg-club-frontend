import { describe, expect, it } from 'vitest';

import {
  applyHitPointsInput,
  clampHitPoints,
  countParticipants,
  formatHitPointStep,
  getHitPointsTone,
  getParticipantTypeLabel,
  getTrackerErrorMessage,
  getTrackerHeaders,
  getTrackerNameBody,
  getTrackerRoute,
  getTurnReel,
  isParticipantCurrent,
  isParticipantRolled,
  parseParticipantValues,
  parseTrackerSlot,
  pickPairRoll,
  toCreatureOptions,
  toCreatureSummary,
} from '~tools/initiative/model';

const player = {
  id: 'p1',
  type: 'PLAYER',
  typeName: 'Игрок',
  name: 'Торин',
  dead: false,
  initiativeBonus: 2,
} as const;

const creature = {
  id: 'c1',
  type: 'CREATURE',
  name: 'Гоблин 1',
  dead: true,
  initiativeBonus: 2,
  initiativeRoll: 10,
  initiativeTotal: 12,
  creatureUrl: 'goblin',
} as const;

describe('трекер инициативы', () => {
  it('строит адрес трекера и заголовок гостя', () => {
    expect(getTrackerRoute('abc')).toBe('/tools/initiative/abc');
    expect(getTrackerHeaders('key')).toEqual({ 'X-Tracker-Key': 'key' });
    expect(getTrackerHeaders()).toEqual({});
  });

  it('берёт текст ошибки из ответа бэкенда', () => {
    expect(
      getTrackerErrorMessage('Не вышло', { data: { message: 'Лимит' } }),
    ).toBe('Не вышло. Лимит');

    expect(getTrackerErrorMessage('Не вышло', new Error('x'))).toBe('Не вышло');
  });

  it('читает слот гостя и отбрасывает битый', () => {
    expect(parseTrackerSlot('{"trackerId":"t","accessKey":"k"}')).toEqual({
      trackerId: 't',
      accessKey: 'k',
    });

    expect(parseTrackerSlot('{"trackerId":""}')).toBeNull();
    expect(parseTrackerSlot('не json')).toBeNull();
  });

  it('считает участников и броски', () => {
    expect(countParticipants([player, creature], 'PLAYER')).toBe(1);
    expect(isParticipantRolled(player)).toBe(false);
    expect(isParticipantRolled(creature)).toBe(true);
  });

  it('подписывает тип участника', () => {
    expect(getParticipantTypeLabel(player)).toBe('Игрок');
    expect(getParticipantTypeLabel(creature)).toBe('Существо');
  });

  it('не считает текущим поверженного', () => {
    expect(isParticipantCurrent(player, 'p1')).toBe(true);
    expect(isParticipantCurrent(creature, 'c1')).toBe(false);
  });

  it('берёт больший или меньший из двух бросков', () => {
    expect(pickPairRoll(4, 17, true)).toBe(17);
    expect(pickPairRoll(4, 17, false)).toBe(4);
  });

  it('не шлёт пустое имя трекера', () => {
    expect(getTrackerNameBody('  ')).toEqual({});
    expect(getTrackerNameBody(' Бой ')).toEqual({ name: 'Бой' });
  });

  it('превращает существ бестиария в варианты', () => {
    expect(
      toCreatureOptions([
        {
          url: 'goblin',
          name: { rus: 'Гоблин', eng: 'Goblin' },
          type: 'гуманоид',
          challengeRating: '1/4',
        },
      ]),
    ).toEqual([{ value: 'goblin', label: 'Гоблин', challengeRating: '1/4' }]);
  });
});

describe('хиты', () => {
  it('держит хиты между нулём и максимумом', () => {
    expect(clampHitPoints(-3, 20)).toBe(0);
    expect(clampHitPoints(25, 20)).toBe(20);
    expect(clampHitPoints(25, 0)).toBe(25);
  });

  it('разбирает ввод: значение, лечение и урон', () => {
    expect(applyHitPointsInput('12', 30, 40)).toBe(12);
    expect(applyHitPointsInput('+7', 30, 40)).toBe(37);
    expect(applyHitPointsInput('+70', 30, 40)).toBe(40);
    expect(applyHitPointsInput('-6', 30, 40)).toBe(24);
    expect(applyHitPointsInput(' -60 ', 30, 0)).toBe(0);
    expect(applyHitPointsInput('abc', 30, 40)).toBeUndefined();
  });

  it('окрашивает остаток', () => {
    expect(getHitPointsTone(0, 20)).toBe('error');
    expect(getHitPointsTone(10, 20)).toBe('warning');
    expect(getHitPointsTone(11, 20)).toBeUndefined();
    expect(getHitPointsTone(3, 0)).toBeUndefined();
  });

  it('подписывает шаги со знаком', () => {
    expect(formatHitPointStep(5)).toBe('+5');
    expect(formatHitPointStep(-1)).toBe('-1');
  });

  it('читает значения из хранилища, битые отбрасывает', () => {
    expect(parseParticipantValues('{"t1":{"p1":12}}')).toEqual({
      t1: { p1: 12 },
    });

    expect(parseParticipantValues('{"t1":{"p1":"x"}}')).toEqual({});
    expect(parseParticipantValues('nope')).toEqual({});
  });
});

describe('сводка существа', () => {
  it('берёт картинку, КД, опасность и формулу хитов', () => {
    expect(
      toCreatureSummary({
        name: { rus: 'Гоблин', eng: 'Goblin' },
        url: 'goblin',
        challengeRating: '1/4',
        type: { name: 'гуманоид' },
        size: { rus: 'Маленький', eng: 'small' },
        armorClass: 15,
        hits: { average: 7, formula: '2к6', sign: ' + ', bonus: 0 },
        ability: { str: 8, dex: 14, con: 10, int: 10, wiz: 8, cha: 8 },
        images: ['/goblin.webp'],
      }),
    ).toEqual({
      image: '/goblin.webp',
      armorClass: 15,
      challengeRating: '1/4',
      maxHitPoints: 7,
      hitFormula: '2к6',
    });
  });
});

describe('лента ходов', () => {
  const second = { ...player, id: 'p2', name: 'Эльза' };

  it('ставит текущего в центр и отделяет раунды', () => {
    const { cells, column } = getTurnReel([player, second], 'p2', 2);

    const current = cells.find(
      (cell) => cell.kind === 'token' && cell.isCurrent,
    );

    expect(column).toBe(7);
    expect(current?.column).toBe(column);

    expect(
      cells.some((cell) => cell.kind === 'divider' && cell.round === 2),
    ).toBe(true);
  });

  it('без участников пуста', () => {
    expect(getTurnReel([], undefined, 1).cells).toEqual([]);
  });
});
