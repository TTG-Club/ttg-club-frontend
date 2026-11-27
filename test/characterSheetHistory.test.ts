import { describe, expect, it } from 'vitest';

import { characterSheetListSchema } from '~character-sheet/model';

describe('история удалённых листов', () => {
  it('список читает историю и её лимиты', () => {
    const list = characterSheetListSchema.parse({
      items: [],
      used: 0,
      limit: 10,
      subscriberLimit: 20,
      history: [
        {
          id: 'old',
          name: 'Старый',
          data: null,
          deletedAt: '2026-11-23T10:00:00Z',
        },
      ],
      historyLimit: 20,
      subscriberHistoryLimit: 30,
    });

    expect(list.history).toEqual([
      { id: 'old', name: 'Старый', deletedAt: '2026-11-23T10:00:00Z' },
    ]);

    expect(list.historyLimit).toBe(20);
    expect(list.subscriberHistoryLimit).toBe(30);
  });

  it('ответ без истории (старый бэкенд) даёт пустую историю', () => {
    const list = characterSheetListSchema.parse({
      items: [],
      used: 0,
      limit: 10,
    });

    expect(list.history).toEqual([]);
    expect(list.historyLimit).toBe(0);
  });
});
