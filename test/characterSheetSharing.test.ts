import { describe, expect, it } from 'vitest';

import {
  characterSheetListSchema,
  getSharedSheetRoute,
  getSheetLimitTooltip,
  getSheetShareUrl,
  savedSheetListSchema,
  sharedSheetSchema,
  SHEET_LIMIT_TEXT,
} from '~character-sheet/model';

describe('лист по ссылке', () => {
  it('адрес страницы и полная ссылка', () => {
    expect(getSharedSheetRoute('abc-1')).toBe(
      '/tools/character-sheet/shared/abc-1',
    );

    expect(getSheetShareUrl('https://5e14.ttg.club', 'abc-1')).toBe(
      'https://5e14.ttg.club/tools/character-sheet/shared/abc-1',
    );
  });

  it('ответ по ссылке разбирается в документ листа', () => {
    const shared = sharedSheetSchema.parse({
      id: 's1',
      name: 'Торин',
      data: { experience: 300 },
      own: false,
      savedId: null,
    });

    expect(shared.data.experience).toBe(300);
    expect(shared.data.classes).toEqual([]);
    expect(shared.savedId).toBeNull();
  });

  it('недоступный сохранённый лист приходит без документа', () => {
    const list = savedSheetListSchema.parse({
      items: [
        {
          id: 'r1',
          sheetId: 's1',
          shareToken: 't1',
          name: 'Старое имя',
          data: null,
          available: false,
        },
      ],
      used: 1,
      limit: 16,
      subscriberLimit: 40,
    });

    expect(list.items[0]?.data).toBeNull();
    expect(list.subscriberLimit).toBe(40);
  });

  it('старый ответ списка без лимита подписки и ссылки читается', () => {
    const list = characterSheetListSchema.parse({
      items: [
        {
          id: 's1',
          name: 'Торин',
          data: {},
          version: 1,
          createdAt: '2026-11-24T00:00:00Z',
          updatedAt: '2026-11-24T00:00:00Z',
        },
      ],
      used: 1,
      limit: 10,
    });

    expect(list.subscriberLimit).toBe(0);
    expect(list.items[0]?.shareToken).toBeNull();
  });
});

describe('подсказка лимита', () => {
  const base = SHEET_LIMIT_TEXT.sheets(3, 10);

  it('без подписки говорит, сколько даст подписка', () => {
    expect(getSheetLimitTooltip(base, 10, 20)).toBe(
      `${base} С подпиской — до 20 листов.`,
    );
  });

  it('с подпиской отмечает расширенный лимит', () => {
    expect(getSheetLimitTooltip(base, 20, 20)).toBe(
      `${base} Лимит расширен подпиской.`,
    );
  });

  it('без сведений о подписке — только занятое место', () => {
    expect(getSheetLimitTooltip(base, 10, 0)).toBe(base);
  });
});
