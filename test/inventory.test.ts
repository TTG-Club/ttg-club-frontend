import { describe, expect, it } from 'vitest';

import {
  getItemCategoriesLabel,
  getItemCategoryGroups,
  getItemCategoryOrder,
  getMagicItemEditPath,
  getMagicItemTypeParts,
  getRarityGroup,
  getTreasureKey,
  getTreasurePrice,
  isItemsGrouping,
  itemDetailSchema,
  itemLinkSchema,
  magicItemDetailSchema,
  treasureSchema,
} from '~inventory/model';
import { getFirstLetterGroup, groupItems } from '~section/model';

const name = { rus: 'Сумка хранения', eng: 'Bag of Holding' };
const rarity = { type: 'uncommon', name: 'необычный' };

describe('магические предметы', () => {
  it('группирует по редкости с заглавной буквы', () => {
    expect(
      getRarityGroup({ name, url: '/items/magic/Bag_of_Holding', rarity }),
    ).toBe('Необычный');
  });

  it('правка ведёт в раздел мастерской для магических предметов', () => {
    expect(getMagicItemEditPath('/items/magic/Bag_of_Holding')).toBe(
      '/workshop/magic-items/Bag_of_Holding/edit',
    );
  });

  it('собирает подпись типа с уточнениями и редкостью', () => {
    const item = magicItemDetailSchema.parse({
      name,
      rarity,
      type: { name: 'Оружие' },
      detailType: [
        { name: 'длинный меч', url: '/weapons/Longsword' },
        { name: 'любой меч' },
      ],
    });

    const parts = getMagicItemTypeParts(item);

    expect(parts.map((part) => part.text).join('')).toBe(
      'Оружие (длинный меч, любой меч), необычный',
    );

    expect(parts.find((part) => part.url)?.text).toBe('длинный меч');
  });

  it('без уточнений обходится без скобок', () => {
    const item = magicItemDetailSchema.parse({
      name,
      rarity,
      type: { name: 'Чудесный предмет' },
    });

    expect(
      getMagicItemTypeParts(item)
        .map((part) => part.text)
        .join(''),
    ).toBe('Чудесный предмет, необычный');
  });
});

describe('снаряжение', () => {
  it('подписывает одну категорию в единственном числе', () => {
    const item = itemDetailSchema.parse({
      name,
      categories: ['Контейнер'],
    });

    expect(getItemCategoriesLabel(item)).toBe('Категория: Контейнер');
  });

  it('подписывает несколько категорий во множественном числе', () => {
    const item = itemDetailSchema.parse({
      name,
      categories: ['Контейнер', 'Набор'],
    });

    expect(getItemCategoriesLabel(item)).toBe('Категории: Контейнер, Набор');
  });

  it('без категорий подпись пустая', () => {
    expect(getItemCategoriesLabel(itemDetailSchema.parse({ name }))).toBe('');
  });

  it('группирует по первой букве русского названия', () => {
    expect(getFirstLetterGroup({ name })).toBe('С');
  });

  it('кладёт предмет в каждую его категорию в порядке справочника', () => {
    const sack = itemLinkSchema.parse({
      name: { rus: 'Мешок', eng: 'Sack' },
      url: '/items/sack',
      categoryGroups: [
        { name: 'Снаряжение', order: 0 },
        { name: 'Контейнеры', order: 4 },
      ],
    });

    const flask = itemLinkSchema.parse({
      name: { rus: 'Фляга', eng: 'Flask' },
      url: '/items/flask',
      categoryGroups: [{ name: 'Контейнеры', order: 4 }],
    });

    const stone = itemLinkSchema.parse({
      name: { rus: 'Камень', eng: 'Stone' },
      url: '/items/stone',
    });

    const groups = groupItems(
      [flask, sack, stone],
      getItemCategoryGroups,
      getItemCategoryOrder,
    );

    expect(
      groups.map((group) => [group.name, group.items.map((item) => item.url)]),
    ).toEqual([
      ['Снаряжение', ['/items/sack']],
      ['Контейнеры', ['/items/flask', '/items/sack']],
      ['Без категории', ['/items/stone']],
    ]);
  });

  it('принимает из cookie только известную группировку', () => {
    expect(isItemsGrouping('alphabet')).toBe(true);
    expect(isItemsGrouping('size')).toBe(false);
  });
});

describe('драгоценности', () => {
  const treasure = treasureSchema.parse({
    name: { rus: 'Агат', eng: 'Agate' },
    type: { name: 'Драгоценный камень', order: 0 },
  });

  it('без цены стоит ноль золотых, как в старом SPA', () => {
    expect(getTreasurePrice(treasure)).toBe('0 зм');
    expect(getTreasurePrice({ ...treasure, price: 50 })).toBe('50 зм');
  });

  it('ключ различает одно название в разных типах', () => {
    expect(getTreasureKey(treasure)).not.toBe(
      getTreasureKey({
        ...treasure,
        type: { name: 'Предмет искусства', order: 1 },
      }),
    );
  });
});
