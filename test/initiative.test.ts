import { describe, expect, it } from 'vitest';

import {
  countParticipants,
  getParticipantTypeLabel,
  getTrackerErrorMessage,
  getTrackerHeaders,
  getTrackerNameBody,
  getTrackerRoute,
  isParticipantCurrent,
  isParticipantRolled,
  parseTrackerSlot,
  pickPairRoll,
  toCreatureOptions,
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
