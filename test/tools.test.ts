import { describe, expect, it } from 'vitest';

import {
  buildEncounterRequest,
  getDefaultSources,
  normalizeToolCount,
  toggleRequiredSource,
} from '~tools/model';

describe('normalizeToolCount', () => {
  it('держит количество в пределах, которые принимает бэкенд', () => {
    expect(normalizeToolCount(undefined)).toBe(1);
    expect(normalizeToolCount(0)).toBe(1);
    expect(normalizeToolCount(5.7)).toBe(5);
    expect(normalizeToolCount(500)).toBe(99);
  });
});

describe('toggleRequiredSource', () => {
  it('добавляет и снимает книгу, но последнюю оставляет', () => {
    expect(toggleRequiredSource(['PHB'], 'TCE')).toEqual(['PHB', 'TCE']);
    expect(toggleRequiredSource(['PHB', 'TCE'], 'PHB')).toEqual(['TCE']);
    expect(toggleRequiredSource(['PHB'], 'PHB')).toEqual(['PHB']);
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
