import { describe, expect, it } from 'vitest';

import {
  buildEncounterRequest,
  buildNameRaceGroups,
  buildNamesRequest,
  formatLootPrice,
  getDefaultSources,
  getLootCountLabel,
  getNameSharedHint,
  getTavernRequest,
  getTavernTags,
  getTraderPrice,
  getTreasuryCoins,
  groupLoot,
  normalizeToolCount,
  parseLootPrice,
  parseTavernVisitors,
  patchTavern,
  resolveTavernSettings,
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

describe('tavern', () => {
  const base = {
    type: 'INN',
    habitat: 'FOREST',
    serviceLevel: 'CHEAP',
    visitors: 3,
  } as const;

  const tavern = {
    ...base,
    name: 'Пьяный дракон',
    menu: '',
    atmosphere: '',
    rumors: '',
    event: '',
    tables: '',
    bartender: '',
  };

  it('оставляет выбранные настройки и дополняет пустые', () => {
    const settings = resolveTavernSettings({ type: 'CAFE' });

    expect(settings.type).toBe('CAFE');
    expect(settings.habitat).toBeTypeOf('string');
    expect(settings.serviceLevel).toBeTypeOf('string');
  });

  it('читает заполненность зала из атмосферы', () => {
    expect(
      parseTavernVisitors('<div data-visitors="4"><h5>Шумно</h5></div>'),
    ).toBe(4);

    expect(parseTavernVisitors('<div>Тихо</div>')).toBe(0);
  });

  it('собирает запрос части по настройкам', () => {
    expect(getTavernRequest('atmosphere', base)).toEqual({
      path: 'atmosphere/',
      query: {},
    });

    expect(getTavernRequest('tables', base)).toEqual({
      path: 'tables',
      query: {
        tavernaType: 'INN',
        atmosphereVisitors: 3,
        serviceLevel: 'CHEAP',
        habitat: 'FOREST',
      },
    });
  });

  it('меняет часть, а с атмосферой и заполненность зала', () => {
    expect(patchTavern(tavern, 'menu', '<p>Эль</p>').menu).toBe('<p>Эль</p>');

    const patched = patchTavern(
      tavern,
      'atmosphere',
      '<div data-visitors="5"></div>',
    );

    expect(patched.visitors).toBe(5);
    expect(tavern.visitors).toBe(3);
  });

  it('подписывает тип, территорию и уровень', () => {
    expect(getTavernTags(base)).toEqual([
      'Постоялый двор / таверна',
      'Лес',
      'Дешёвое',
    ]);
  });
});
