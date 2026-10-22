import { describe, expect, it } from 'vitest';

import {
  assignUnique,
  buildAbilityRows,
  buildAssignedScores,
  buildEncounterRequest,
  buildNameRaceGroups,
  buildNamesRequest,
  buildRaceBonuses,
  formatLootPrice,
  getDefaultSources,
  getLootCountLabel,
  getNameSharedHint,
  getPointBuyItems,
  getPointBuySpent,
  getPointsWord,
  getRaceBonusSlots,
  getTraderPrice,
  getTreasuryCoins,
  groupLoot,
  isSplitBonus,
  normalizeToolCount,
  parseLootPrice,
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

function lootItem(rus: string, price?: number) {
  return {
    name: { rus, eng: rus },
    price,
  };
}

describe('groupLoot', () => {
  const items = [
    lootItem('Зелье', 50),
    lootItem('Свиток', 100),
    lootItem('Зелье', 75),
    lootItem('Зелье', 50),
  ];

  const getPrice = (item: { price?: number }) => item.price;

  it('без группировки оставляет каждый предмет отдельно', () => {
    expect(
      groupLoot(items, getPrice, { isGrouped: false, isMaxPrice: false }),
    ).toHaveLength(4);
  });

  it('сливает одинаковые и берёт среднюю из разных цен', () => {
    const [potion, scroll] = groupLoot(items, getPrice, {
      isGrouped: true,
      isMaxPrice: false,
    });

    expect(potion).toMatchObject({ count: 3, price: 63 });
    expect(scroll).toMatchObject({ count: 1, price: 100 });
  });

  it('с максимальной ценой берёт наибольшую', () => {
    const [potion] = groupLoot(items, getPrice, {
      isGrouped: true,
      isMaxPrice: true,
    });

    expect(potion?.price).toBe(75);
  });

  it('без цен оставляет группу без цены', () => {
    const [potion] = groupLoot([lootItem('Зелье')], getPrice, {
      isGrouped: true,
      isMaxPrice: false,
    });

    expect(potion?.price).toBeUndefined();
  });
});

describe('parseLootPrice', () => {
  it('читает цену строкой и пропускает пустую', () => {
    expect(parseLootPrice('1500')).toBe(1500);
    expect(parseLootPrice(null)).toBeUndefined();
    expect(parseLootPrice('')).toBeUndefined();
    expect(parseLootPrice('(100) / 2')).toBeUndefined();
  });
});

describe('getTraderPrice', () => {
  it('берёт цену выбранной книги', () => {
    const item = {
      name: { rus: 'Зелье', eng: 'Potion' },
      url: '/items/magic/potion',
      rarity: { type: 'common', name: 'обычный' },
      price: { dmg: '40', xge: '60' },
    };

    expect(getTraderPrice(item, 'XGE')).toBe(60);
    expect(getTraderPrice(item, undefined)).toBeUndefined();
  });
});

describe('formatLootPrice и getLootCountLabel', () => {
  it('пишут цену с разрядами и количество только для группы', () => {
    expect(formatLootPrice(12500)).toBe('12\u00A0500 зм');
    expect(getLootCountLabel(1)).toBeUndefined();
    expect(getLootCountLabel(3)).toBe('×3');
  });
});

describe('getTreasuryCoins', () => {
  it('ставит ноль на месте отсутствующих монет', () => {
    expect(
      getTreasuryCoins({ gold: 12, copper: null }).map((coin) => coin.value),
    ).toEqual([0, 0, 0, 12, 0]);
  });
});

describe('assignUnique', () => {
  it('ставит выбор в ячейку и снимает его с другой', () => {
    expect(assignUnique(['A', undefined, 'B'], 1, 'A')).toEqual([
      undefined,
      'A',
      'B',
    ]);

    expect(assignUnique(['A', 'B'], 0, undefined)).toEqual([undefined, 'B']);
  });
});

describe('buildAssignedScores', () => {
  it('берёт только назначенные значения', () => {
    expect(
      buildAssignedScores(
        [15, 14, undefined],
        ['WISDOM', undefined, 'CHARISMA'],
      ),
    ).toEqual({ WISDOM: 15 });
  });
});

describe('«покупка» значений', () => {
  const scores = {
    STRENGTH: 15,
    DEXTERITY: 15,
    CONSTITUTION: 15,
    INTELLIGENCE: 8,
    WISDOM: 8,
    CHARISMA: 8,
  };

  it('считает потраченные очки', () => {
    expect(getPointBuySpent(scores)).toBe(27);
  });

  it('подписывает разницу и отключает недоступное', () => {
    const items = getPointBuyItems(scores, 'WISDOM');

    expect(items[0]).toEqual({ label: '8', value: 8, disabled: false });
    expect(items[1]).toMatchObject({ label: '9 (+1 очко)', disabled: true });

    expect(getPointBuyItems(scores, 'STRENGTH')[0]?.label).toBe('8 (−9 очков)');
  });

  it('склоняет «очко»', () => {
    expect(getPointsWord(1)).toBe('очко');
    expect(getPointsWord(3)).toBe('очка');
    expect(getPointsWord(7)).toBe('очков');
  });
});

describe('бонусы расы', () => {
  const human = [
    { key: 'CHARISMA', name: 'Харизма', value: 2 },
    { key: 'ONE', name: 'к одной', value: 1 },
    { key: 'CHOICE', name: 'к другой', value: 1 },
  ];

  const tasha = [{ key: 'CHOICE_DOUBLE', name: '+2 и +1', value: 0 }];

  it('раскладывает бонусы на выбор по ячейкам', () => {
    expect(getRaceBonusSlots(human, undefined)).toEqual([1, 1]);

    expect(
      getRaceBonusSlots(
        [{ key: 'CHOICE_UNIQUE', name: 'к 2 другим', value: 1 }],
        undefined,
      ),
    ).toEqual([1, 1]);

    expect(isSplitBonus(tasha)).toBe(true);
    expect(getRaceBonusSlots(tasha, 'FOR_TWO')).toEqual([2, 1]);
    expect(getRaceBonusSlots(tasha, 'FOR_THREE')).toEqual([1, 1, 1]);
  });

  it('складывает заданные и выбранные бонусы', () => {
    expect(buildRaceBonuses(human, [1, 1], ['CHARISMA', 'WISDOM'])).toEqual({
      CHARISMA: 3,
      WISDOM: 1,
    });
  });
});

describe('buildAbilityRows', () => {
  it('считает итог и модификатор только при значении', () => {
    const rows = buildAbilityRows(
      { STRENGTH: 15 },
      { STRENGTH: 2, DEXTERITY: 1 },
    );

    expect(rows[0]).toMatchObject({ total: 17, modifier: '+3' });
    expect(rows[1]?.bonus).toBe(1);
    expect(rows[1]?.total).toBeUndefined();
  });
});
