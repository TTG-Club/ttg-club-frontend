import { describe, expect, it } from 'vitest';

import {
  getEntryApiPath,
  getWorkshopEditPath,
  hasSourceGroupLabel,
} from '~section/model';
import {
  bookLinkSchema,
  getBookGroup,
  getGodGroup,
  godDetailSchema,
  godLinkSchema,
  joinWikiList,
} from '~wiki/model';

describe('адреса записи', () => {
  it('ручка записи совпадает с её адресом на сайте', () => {
    expect(getEntryApiPath('/gods/Bane')).toBe('/api/v1/gods/Bane');
  });

  it('правка ведёт в мастерскую старого SPA', () => {
    expect(getWorkshopEditPath('/rules/Advantage')).toBe(
      '/workshop/rules/Advantage/edit',
    );
  });
});

describe('источник записи', () => {
  it('подписывает группу только у стороннего материала и хомбрю', () => {
    const base = { shortName: 'PHB', name: 'Книга игрока' };

    expect(
      hasSourceGroupLabel({
        ...base,
        group: { shortName: 'HB', name: 'Хомбрю' },
      }),
    ).toBe(true);

    expect(
      hasSourceGroupLabel({
        ...base,
        group: { shortName: 'Basic', name: 'Официальные источники' },
      }),
    ).toBe(false);

    expect(hasSourceGroupLabel(base)).toBe(false);
  });
});

describe('вики', () => {
  it('группирует богов по мировоззрению с заглавной буквы', () => {
    const god = godLinkSchema.parse({
      name: { rus: 'Бейн', eng: 'Bane' },
      url: '/gods/Bane',
      alignment: 'законно-злой',
      shortAlignment: 'ЗЗ',
    });

    expect(getGodGroup(god)).toBe('Законно-злой');
  });

  it('принимает карточку бога без необязательных свойств', () => {
    const god = godDetailSchema.parse({
      name: { rus: 'Бейн', eng: 'Bane' },
      alignment: 'законно-злой',
      shortAlignment: 'ЗЗ',
    });

    expect(joinWikiList(god.domains)).toBe('');
  });

  it('группирует источники по типу книги', () => {
    const book = bookLinkSchema.parse({
      name: { rus: 'Книга игрока', eng: "Player's Handbook" },
      url: '/books/PHB',
      type: { name: 'Официальные', order: 0 },
    });

    expect(getBookGroup(book)).toBe('Официальные');
  });

  it('собирает значения свойства через запятую', () => {
    expect(joinWikiList(['Война', 'Обман'])).toBe('Война, Обман');
  });
});
