import type { SheetDocument, SheetItem } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  createSheetItem,
  getProficiencyNames,
  getSheetStats,
  getUnproficientArmor,
  getWeaponAttack,
  isArmorProficient,
  isWeaponProficient,
  proficiencyGrantSchema,
  sheetArmorSchema,
  sheetDocumentSchema,
  sheetWeaponSchema,
} from '~character-sheet/model';

/**
 * Лист с журналом выдач.
 * @param grants - выданное источниками
 * @param patch - поля листа
 */
function makeDocument(
  grants: Array<Record<string, unknown>>,
  patch: Record<string, unknown> = {},
): SheetDocument {
  return sheetDocumentSchema.parse({
    ...patch,
    proficiencyGrants: grants.map((grant, index) =>
      proficiencyGrantSchema.parse({ sourceId: `s${index}`, ...grant }),
    ),
  });
}

/**
 * Оружие из снаряжения.
 * @param name - название
 * @param weapon - поля оружия
 */
function makeWeapon(name: string, weapon: Record<string, unknown>): SheetItem {
  return {
    ...createSheetItem(name, null),
    weapon: sheetWeaponSchema.parse({ damage: '1к6', ...weapon }),
  };
}

/**
 * Надетый доспех.
 * @param name - название
 * @param category - категория доспеха
 */
function makeArmor(name: string, category: string): SheetItem {
  return {
    ...createSheetItem(name, null),
    isEquipped: true,
    armor: sheetArmorSchema.parse({ category, baseArmorClass: 11 }),
  };
}

describe('владения листа: старые данные', () => {
  it('строка владений делится на записи', () => {
    const document = sheetDocumentSchema.parse({
      proficiencies: {
        armor: 'Лёгкие доспехи, щиты',
        weapons: 'Простое оружие;\nДлинный меч',
        tools: 'Воровские инструменты',
        languages: '',
      },
    });

    expect(document.proficiencies).toEqual({
      armor: ['Лёгкие доспехи', 'щиты'],
      weapons: ['Простое оружие', 'Длинный меч'],
      tools: [{ name: 'Воровские инструменты', url: null }],
      languages: [],
    });
  });

  it('снятый флаг владения оружием становится «не владею»', () => {
    const document = sheetDocumentSchema.parse({
      inventory: [
        { id: 'a', name: 'Кинжал', weapon: { isProficient: false } },
        { id: 'b', name: 'Копьё', weapon: { isProficient: true } },
      ],
    });

    expect(document.inventory.map((item) => item.weapon?.proficiency)).toEqual([
      'no',
      null,
    ]);
  });

  it('лист без владений считает оружие и доспех освоенными', () => {
    const document = makeDocument([]);

    expect(isWeaponProficient(document, makeWeapon('Глефа', {}))).toBe(true);
    expect(isArmorProficient(document, makeArmor('Латы', 'HEAVY'))).toBe(true);
  });
});

describe('владения листа: оружие', () => {
  const document = makeDocument(
    [{ weapons: ['Простое оружие'], armor: ['Лёгкие доспехи'] }],
    { proficiencies: { weapons: ['длинный МЕЧ'] } },
  );

  it('выданное и своё объединяются', () => {
    expect(getProficiencyNames(document, 'weapons')).toEqual([
      'Простое оружие',
      'длинный МЕЧ',
    ]);
  });

  it('группа, название и ручная отметка', () => {
    expect(isWeaponProficient(document, makeWeapon('Булава', {}))).toBe(true);

    expect(
      isWeaponProficient(document, makeWeapon('Глефа', { isMartial: true })),
    ).toBe(false);

    expect(
      isWeaponProficient(
        document,
        makeWeapon('Длинный меч', { isMartial: true }),
      ),
    ).toBe(true);

    expect(
      isWeaponProficient(
        document,
        makeWeapon('Глефа', { isMartial: true, proficiency: 'yes' }),
      ),
    ).toBe(true);

    expect(
      isWeaponProficient(document, makeWeapon('Булава', { proficiency: 'no' })),
    ).toBe(false);
  });

  it('бонус мастерства — только с владением', () => {
    const glaive = makeWeapon('Глефа', { isMartial: true });
    const mace = makeWeapon('Булава', {});

    expect(getWeaponAttack(document, glaive, 2)?.proficiency).toBe(0);
    expect(getWeaponAttack(document, mace, 2)?.proficiency).toBe(2);
  });

  it('половинная группа: простое рукопашное', () => {
    const melee = makeDocument([{ weapons: ['Простое рукопашное оружие'] }]);

    expect(isWeaponProficient(melee, makeWeapon('Булава', {}))).toBe(true);

    expect(
      isWeaponProficient(
        melee,
        makeWeapon('Лёгкий арбалет', { isRanged: true }),
      ),
    ).toBe(false);
  });
});

describe('владения листа: доспех без владения', () => {
  it('помеха к броскам Силы и Ловкости и запрет заклинаний', () => {
    const plate = makeArmor('Латы', 'HEAVY');
    const leather = makeArmor('Кожаный доспех', 'LIGHT');

    const document = makeDocument([{ armor: ['Лёгкие доспехи'] }], {
      inventory: [plate, leather],
    });

    expect(getUnproficientArmor(document).map((item) => item.name)).toEqual([
      'Латы',
    ]);

    const stats = getSheetStats(document);

    expect(stats.unproficientArmor).toEqual([plate.id]);
    expect(stats.flags.has('attack.disadvantage')).toBe(true);
    expect(stats.flags.has('save.disadvantage.strength')).toBe(true);
    expect(stats.flags.has('abilityCheck.disadvantage.dexterity')).toBe(true);
    expect(stats.flags.has('save.disadvantage.wisdom')).toBe(false);
  });

  it('снятый доспех не мешает', () => {
    const plate = { ...makeArmor('Латы', 'HEAVY'), isEquipped: false };

    const document = makeDocument([{ armor: ['Щиты'] }], {
      inventory: [plate],
    });

    expect(getSheetStats(document).unproficientArmor).toEqual([]);
  });
});
