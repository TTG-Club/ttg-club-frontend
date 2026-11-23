import type { SheetDocument, SheetItem } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  copyItemAsCustom,
  createEmptySheetDocument,
  createSheetItem,
  getAttunementBreakdown,
  getCarriedWeight,
  getCarryingBreakdown,
  getCoinWeight,
  getCurrencyInGold,
  getEncumbrance,
  getItemPreviewType,
  getSheetRollMode,
  getSheetStats,
  getWeaponAttack,
  isArmorTooHeavy,
  isHeavyWeaponHindered,
  isItemMechanicsActive,
  sheetArmorSchema,
  sheetWeaponSchema,
  sortItemsByName,
} from '~character-sheet/model';

/**
 * Лист с правками поверх пустого.
 * @param patch - правки
 */
function makeDocument(patch: Partial<SheetDocument> = {}): SheetDocument {
  return { ...createEmptySheetDocument(), ...patch };
}

/**
 * Предмет с весом и количеством.
 * @param weight - вес штуки
 * @param quantity - количество
 */
function makeItem(weight: number, quantity = 1): SheetItem {
  return { ...createSheetItem('Груз', null), weight, quantity };
}

const ABILITIES = {
  STRENGTH: 10,
  DEXTERITY: 10,
  CONSTITUTION: 10,
  INTELLIGENCE: 10,
  WISDOM: 10,
  CHARISMA: 10,
};

describe('вес и монеты', () => {
  it('монеты весят: 50 монет — фунт; предмет с нулём не весит', () => {
    const document = makeDocument({
      inventory: [makeItem(2.5, 2), makeItem(10, 0)],
      currency: { cp: 0, sp: 20, ep: 0, gp: 30, pp: 0 },
    });

    expect(getCoinWeight(document.currency)).toBe(1);
    expect(getCarriedWeight(document)).toBe(6);
  });

  it('монеты пересчитываются в золото', () => {
    expect(getCurrencyInGold({ cp: 50, sp: 5, ep: 2, gp: 3, pp: 1 })).toBe(15);
  });
});

describe('грузоподъёмность', () => {
  it('сила × 15 × размер, бонус и своё значение', () => {
    const base = makeDocument({ size: 'LARGE' });

    expect(getCarryingBreakdown(base, 10).value).toBe(300);

    expect(
      getCarryingBreakdown(
        {
          ...base,
          carrying: { ...base.carrying, size: 'TINY', bonus: 10 },
        },
        10,
      ).value,
    ).toBe(85);

    expect(
      getCarryingBreakdown(
        { ...base, carrying: { ...base.carrying, custom: 42 } },
        10,
      ).value,
    ).toBe(42);
  });

  it('вариант «Нагрузка»: ступени и скорость', () => {
    const document = makeDocument({
      abilities: ABILITIES,
      speed: 30,
      inventory: [makeItem(60)],
      carrying: { size: null, custom: null, bonus: 0, encumbrance: true },
    });

    const carrying = getCarryingBreakdown(document, 10);

    expect(getEncumbrance(document, carrying, 50)).toBe('none');
    expect(getEncumbrance(document, carrying, 60)).toBe('encumbered');
    expect(getEncumbrance(document, carrying, 101)).toBe('heavy');

    expect(getSheetStats(document).speeds.walk).toBe(20);

    const heavy = getSheetStats({ ...document, inventory: [makeItem(120)] });

    expect(heavy.speeds.walk).toBe(10);

    expect(
      getSheetRollMode(heavy.flags, {
        kind: 'savingThrow',
        ability: 'constitution',
      }),
    ).toBe('disadvantage');

    expect(
      getSheetRollMode(heavy.flags, { kind: 'savingThrow', ability: 'wisdom' }),
    ).toBe('normal');
  });

  it('без варианта нагрузка не мешает', () => {
    const document = makeDocument({
      abilities: ABILITIES,
      speed: 30,
      inventory: [makeItem(120)],
    });

    expect(getSheetStats(document).encumbrance).toBe('none');
    expect(getSheetStats(document).speeds.walk).toBe(30);
  });
});

describe('правила снаряжения 2014', () => {
  it('доспеху не хватает Силы — скорость −10 фт', () => {
    const plate: SheetItem = {
      ...createSheetItem('Латы', null),
      isEquipped: true,
      armor: sheetArmorSchema.parse({
        category: 'HEAVY',
        baseArmorClass: 18,
        strengthRequirement: 15,
      }),
    };

    const document = makeDocument({
      abilities: ABILITIES,
      speed: 30,
      inventory: [plate],
    });

    expect(isArmorTooHeavy(document, 10)).toBe(true);
    expect(isArmorTooHeavy(document, 15)).toBe(false);
    expect(getSheetStats(document).speeds.walk).toBe(20);
  });

  it('тяжёлое оружие мешает Маленькому', () => {
    const glaive: SheetItem = {
      ...createSheetItem('Глефа', null),
      weapon: sheetWeaponSchema.parse({ damage: '1к10', isHeavy: true }),
    };

    expect(isHeavyWeaponHindered(glaive, 'SMALL')).toBe(true);
    expect(isHeavyWeaponHindered(glaive, 'MEDIUM')).toBe(false);
    expect(isHeavyWeaponHindered(glaive, null)).toBe(false);

    expect(
      getSheetRollMode(new Set(), { kind: 'attack', isHindered: true }),
    ).toBe('disadvantage');
  });

  it('предел настройки: правило, характеристика, бонус и своё число', () => {
    const modifier = () => 2;

    expect(
      getAttunementBreakdown(
        { attunement: { custom: null, ability: null, bonus: 1 } },
        modifier,
      ).value,
    ).toBe(4);

    expect(
      getAttunementBreakdown(
        { attunement: { custom: null, ability: 'INTELLIGENCE', bonus: 0 } },
        modifier,
      ).value,
    ).toBe(2);

    expect(
      getAttunementBreakdown(
        { attunement: { custom: 5, ability: null, bonus: 1 } },
        modifier,
      ).value,
    ).toBe(5);
  });
});

describe('строка предмета', () => {
  it('универсальное оружие двумя руками и дополнительный урон', () => {
    const longsword: SheetItem = {
      ...createSheetItem('Длинный меч', '/weapons/longsword'),
      weapon: sheetWeaponSchema.parse({
        damage: '1к8',
        versatileDamage: '1к10',
        extraDamage: '1к6',
        extraDamageType: 'огонь',
        bonus: 1,
      }),
    };

    const document = makeDocument({
      abilities: { ...ABILITIES, STRENGTH: 16 },
    });

    const oneHand = getWeaponAttack(document, longsword, 2);

    expect(oneHand?.damage).toBe('1к8 + 4');
    expect(oneHand?.attackBonus).toBe(6);
    expect(oneHand?.extraDamage).toBe('1к6');

    expect(
      getWeaponAttack(document, { ...longsword, useTwoHands: true }, 2)?.damage,
    ).toBe('1к10 + 4');
  });

  it('механика включаемого и отсутствующего предмета', () => {
    const boots: SheetItem = {
      ...createSheetItem('Сапоги', null),
      isEquipped: true,
      activatable: true,
    };

    expect(isItemMechanicsActive(boots)).toBe(false);
    expect(isItemMechanicsActive({ ...boots, isActive: true })).toBe(true);

    expect(
      isItemMechanicsActive({ ...boots, isActive: true, quantity: 0 }),
    ).toBe(false);
  });

  it('вид предпросмотра, копия в свой и порядок по алфавиту', () => {
    expect(getItemPreviewType('/items/magic/bag')).toBe('magic-item');
    expect(getItemPreviewType('/weapons/club')).toBe('weapon');
    expect(getItemPreviewType('/armors/plate')).toBe('armor');
    expect(getItemPreviewType('/items/rope')).toBe('item');
    expect(getItemPreviewType(null)).toBeNull();

    const copy = copyItemAsCustom(
      { ...createSheetItem('Верёвка', '/items/rope'), isEquipped: true },
      'copy',
    );

    expect(copy).toMatchObject({ id: 'copy', url: null, isEquipped: false });

    expect(
      sortItemsByName([{ name: 'Яблоко' }, { name: 'арбалет' }]).map(
        (item) => item.name,
      ),
    ).toEqual(['арбалет', 'Яблоко']);
  });
});
