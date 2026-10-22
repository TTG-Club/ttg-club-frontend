import { describe, expect, it } from 'vitest';

import {
  buildEncounterRequest,
  buildNameRaceGroups,
  buildNamesRequest,
  getDefaultSources,
  getNameSharedHint,
  normalizeToolCount,
  toggleRequired,
} from '~tools/model';

describe('normalizeToolCount', () => {
  it('держит количество в пределах, которые принимает бэкенд', () => {
    expect(normalizeToolCount(undefined)).toBe(1);
    expect(normalizeToolCount(0)).toBe(1);
    expect(normalizeToolCount(5.7)).toBe(5);
    expect(normalizeToolCount(500)).toBe(99);
  });
});

describe('toggleRequired', () => {
  it('добавляет и снимает книгу, но последнюю оставляет', () => {
    expect(toggleRequired(['PHB'], 'TCE')).toEqual(['PHB', 'TCE']);
    expect(toggleRequired(['PHB', 'TCE'], 'PHB')).toEqual(['TCE']);
    expect(toggleRequired(['PHB'], 'PHB')).toEqual(['PHB']);
  });
});

describe('getDefaultSources', () => {
  it('выбирает PHB, а без неё первую книгу', () => {
    expect(getDefaultSources(['TCE', 'PHB'], 'PHB')).toEqual(['PHB']);
    expect(getDefaultSources(['TCE'], 'PHB')).toEqual(['TCE']);
    expect(getDefaultSources([], 'PHB')).toEqual([]);
  });
});

describe('buildEncounterRequest', () => {
  it('не шлёт пустые поля, чтобы бэкенд выбрал их сам', () => {
    expect(buildEncounterRequest(undefined, undefined)).toEqual({});

    expect(buildEncounterRequest(2, 'FOREST')).toEqual({
      level: 2,
      environment: 'FOREST',
    });
  });
});

describe('buildNameRaceGroups', () => {
  it('ставит расы без подрас первой группой, а подрасы — под своей расой', () => {
    expect(
      buildNameRaceGroups([
        { id: 1, name: 'Эльф', parentId: null, available: false },
        { id: 2, name: 'Лесной эльф', parentId: 1, available: true },
        { id: 3, name: 'Высший эльф', parentId: 1, available: true },
        { id: 4, name: 'Человек', parentId: null, available: true },
        { id: 5, name: 'Дварф', parentId: null, available: true },
        { id: 6, name: 'Горный дварф', parentId: 5, available: true },
      ]),
    ).toEqual([
      [{ label: 'Человек', value: 4 }],
      [
        { label: 'Дварф', value: 5 },
        { label: 'Горный дварф', value: 6, class: 'ps-6' },
      ],
      [
        { label: 'Эльф', type: 'label' },
        { label: 'Высший эльф', value: 3 },
        { label: 'Лесной эльф', value: 2 },
      ],
    ]);
  });
});

describe('buildNamesRequest', () => {
  it('для одного персонажа просит одно имя, без рас — любую расу', () => {
    expect(
      buildNamesRequest({
        type: 'SINGLE',
        components: ['NAME'],
        count: 10,
        raceIds: [],
        sexes: ['MALE'],
      }),
    ).toEqual({
      type: 'SINGLE',
      components: ['NAME'],
      count: 1,
      raceIds: null,
      sexes: ['MALE'],
    });

    expect(
      buildNamesRequest({
        type: 'FAMILY',
        components: ['NAME'],
        count: 4,
        raceIds: [2],
        sexes: ['MALE', 'FEMALE'],
      }).count,
    ).toBe(4);
  });
});

describe('getNameSharedHint', () => {
  it('подсказывает только для семьи, клана и дома', () => {
    expect(getNameSharedHint('GROUP')).toBeUndefined();
    expect(getNameSharedHint('CLAN')).toContain('клан');
  });
});
