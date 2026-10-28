import { describe, expect, it } from 'vitest';

import {
  buildSearchRequest,
  getSearchPage,
  getSearchPageCount,
  getSearchRange,
  searchResponseSchema,
} from '~infrastructure/search/model';

describe('поиск по сайту', () => {
  it('считает страницы запроса с нуля', () => {
    expect(buildSearchRequest('огонь', 3, 20)).toEqual({
      page: 2,
      size: 20,
      search: { value: 'огонь', exact: false },
      order: [],
    });
  });

  it('берёт номер страницы из адреса', () => {
    expect(getSearchPage('3')).toBe(3);
    expect(getSearchPage(['2', '5'])).toBe(2);
    expect(getSearchPage('0')).toBe(1);
    expect(getSearchPage('abc')).toBe(1);
    expect(getSearchPage(undefined)).toBe(1);
  });

  it('показывает номера результатов на странице', () => {
    expect(getSearchRange(1, 20, 57)).toEqual({ from: 1, to: 20 });
    expect(getSearchRange(3, 20, 57)).toEqual({ from: 41, to: 57 });
    expect(getSearchRange(4, 20, 57)).toBeNull();
    expect(getSearchRange(1, 20, 0)).toBeNull();
    expect(getSearchPageCount(57, 20)).toBe(3);
  });

  it('принимает ответ бэкенда', () => {
    const response = searchResponseSchema.parse({
      items: [
        {
          name: 'Огненный шар',
          englishName: 'Fireball',
          section: 'Заклинания',
          url: '/spells/fireball',
          description: 'Яркая вспышка…',
          source: {
            shortName: 'PHB',
            name: 'Книга игрока',
            homebrew: false,
          },
        },
      ],
      total: 1,
      page: 0,
      size: 5,
      pages: 1,
    });

    expect(response.items[0]?.source?.shortName).toBe('PHB');
    expect(response.total).toBe(1);
  });
});
