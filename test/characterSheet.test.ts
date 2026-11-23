import type {
  ClassProgression,
  SheetDocument,
  SheetItem,
} from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  applyDamage,
  applyLongRest,
  characterSheetSchema,
  createEmptySheetDocument,
  createSheetItem,
  findSkillByName,
  formatModifier,
  getAbilityModifier,
  getArmorClass,
  getD20Formula,
  getDamageFormula,
  getHitDiceTotals,
  getPactMagic,
  getProficiencyBonus,
  getRaceAbilityBonuses,
  getSkillBonus,
  getSpellSlotsMax,
  getSuggestedMaxHitPoints,
  getWeaponAttack,
  parseSavingThrows,
  parseSpellSlotCells,
  replaceRaceBonuses,
  sheetDocumentSchema,
} from '~character-sheet/model';

/**
 * Лист с изменёнными полями поверх пустого.
 * @param patch - изменённые поля
 */
function makeDocument(patch: Partial<SheetDocument> = {}): SheetDocument {
  return { ...createEmptySheetDocument(), ...patch };
}

/**
 * Заклинательные данные класса для расчёта ячеек.
 * @param level - уровень класса
 * @param spellSlots - ячейки на этом уровне
 * @param maxSlotLevel - наибольший круг на 20 уровне
 */
function makeProgression(
  level: number,
  spellSlots: number[],
  maxSlotLevel: number,
): ClassProgression {
  return {
    classId: String(level),
    level,
    spellSlots,
    maxSlotLevel,
    pact: null,
  };
}

describe('лист персонажа: формат документа', () => {
  it('пустой документ получает начальные значения', () => {
    const document = sheetDocumentSchema.parse({});

    expect(document.abilities.STRENGTH).toBe(10);
    expect(document.classes).toEqual([]);
    expect(document.spellSlotsUsed).toHaveLength(9);
  });

  it('испорченные поля заменяются, остальное сохраняется', () => {
    const document = sheetDocumentSchema.parse({
      abilities: { STRENGTH: 18, DEXTERITY: 'много' },
      classes: [
        { id: '1', name: 'Воин', level: 3, hitDie: 10 },
        { broken: true },
      ],
      health: { max: 30, current: -5, temporary: 0 },
      spellSlotsUsed: [1, 2],
    });

    expect(document.abilities.STRENGTH).toBe(18);
    expect(document.abilities.DEXTERITY).toBe(10);
    expect(document.classes).toHaveLength(1);
    expect(document.health.current).toBe(0);
    expect(document.spellSlotsUsed.slice(0, 3)).toEqual([1, 2, 0]);
  });

  it('ответ API разбирает документ листа', () => {
    const sheet = characterSheetSchema.parse({
      id: 'a',
      name: 'Торин',
      data: null,
      version: 2,
      createdAt: '2026-11-22T10:00:00Z',
      updatedAt: '2026-11-22T10:00:00Z',
    });

    expect(sheet.data.inventory).toEqual([]);
  });
});

describe('лист персонажа: расчёты', () => {
  it.each([
    [1, -5],
    [10, 0],
    [11, 0],
    [15, 2],
    [8, -1],
    [20, 5],
  ])('модификатор значения %i — %i', (score, modifier) => {
    expect(getAbilityModifier(score)).toBe(modifier);
  });

  it('модификатор пишется со знаком', () => {
    expect(formatModifier(3)).toBe('+3');
    expect(formatModifier(0)).toBe('+0');
    expect(formatModifier(-2)).toBe('−2');
  });

  it.each([
    [1, 2],
    [4, 2],
    [5, 3],
    [9, 4],
    [13, 5],
    [17, 6],
    [20, 6],
  ])('бонус мастерства на %i уровне — +%i', (level, bonus) => {
    expect(getProficiencyBonus(level)).toBe(bonus);
  });

  it('компетентность удваивает бонус мастерства', () => {
    const document = makeDocument({
      abilities: { ...createEmptySheetDocument().abilities, DEXTERITY: 16 },
      skills: { STEALTH: 'expertise', ACROBATICS: 'proficient' },
    });

    expect(getSkillBonus(document, 'STEALTH', 3)).toBe(9);
    expect(getSkillBonus(document, 'ACROBATICS', 3)).toBe(6);
    expect(getSkillBonus(document, 'SLEIGHT_OF_HAND', 3)).toBe(3);
  });

  it('кД: средний доспех ограничивает Ловкость, щит прибавляется', () => {
    const armor: SheetItem = {
      ...createSheetItem('Полулаты', null),
      isEquipped: true,
      armor: {
        category: 'MEDIUM',
        baseArmorClass: 15,
        strengthRequirement: null,
        stealthDisadvantage: true,
        bonus: 0,
      },
    };

    const shield: SheetItem = {
      ...createSheetItem('Щит', null),
      isEquipped: true,
      armor: {
        category: 'SHIELD',
        baseArmorClass: 2,
        strengthRequirement: null,
        stealthDisadvantage: false,
        bonus: 1,
      },
    };

    const document = makeDocument({
      abilities: { ...createEmptySheetDocument().abilities, DEXTERITY: 18 },
      inventory: [armor, shield],
    });

    expect(getArmorClass(document)).toBe(20);
    expect(getArmorClass({ ...document, inventory: [] })).toBe(14);
    expect(getArmorClass({ ...document, armorClassOverride: 12 })).toBe(12);
  });

  it('фехтовальное оружие берёт лучшую из Силы и Ловкости', () => {
    const rapier: SheetItem = {
      ...createSheetItem('Рапира', null),
      weapon: {
        damage: '1к8',
        damageType: 'колющий',
        isRanged: false,
        isFinesse: true,
        isProficient: true,
        bonus: 1,
      },
    };

    const document = makeDocument({
      abilities: {
        ...createEmptySheetDocument().abilities,
        STRENGTH: 8,
        DEXTERITY: 16,
      },
    });

    const attack = getWeaponAttack(document, rapier, 2);

    expect(attack?.attackBonus).toBe(6);
    expect(attack?.damage).toBe('1к8 + 4');
    expect(getDamageFormula(attack?.damage ?? '')).toBe('1к8+4');
  });

  it('формула к20 для бросателя кубиков', () => {
    expect(getD20Formula(5)).toBe('1к20+5');
    expect(getD20Formula(-1)).toBe('1к20-1');
    expect(getD20Formula(0)).toBe('1к20');
  });
});

describe('лист персонажа: классы и магия', () => {
  it('ячейки из таблицы класса', () => {
    expect(parseSpellSlotCells(['4', '2', '—', '—'])).toEqual([4, 2, 0, 0]);
  });

  it('один заклинательный класс — ячейки его таблицы', () => {
    const slots = getSpellSlotsMax([makeProgression(5, [4, 2], 5)]);

    expect(slots.slice(0, 3)).toEqual([4, 2, 0]);
  });

  it('мультикласс: волшебник 3 и паладин 4 — заклинатель 5 уровня', () => {
    const slots = getSpellSlotsMax([
      makeProgression(3, [4, 2], 9),
      makeProgression(4, [3], 5),
      makeProgression(2, [], 0),
    ]);

    expect(slots.slice(0, 4)).toEqual([4, 3, 2, 0]);
  });

  it('магия договора из колонок таблицы колдуна', () => {
    const columns = [
      { name: 'Ячейки заклинаний', levels: [1, 2, 2, 2, 2] },
      { name: 'Уровень ячеек', levels: [1, 1, 2, 2, 3] },
    ];

    expect(getPactMagic(columns, 5)).toEqual({ slots: 2, level: 3 });
    expect(getPactMagic([], 5)).toBeNull();
  });

  it('спасброски и навыки по русским названиям', () => {
    expect(parseSavingThrows('Мудрость, Харизма')).toEqual([
      'WISDOM',
      'CHARISMA',
    ]);

    expect(findSkillByName('Обращение с животными')).toBe('ANIMAL_HANDLING');
    expect(findSkillByName('Чародейство')).toBeNull();
  });

  it('смена расы снимает прежние бонусы', () => {
    const base = createEmptySheetDocument().abilities;

    const dwarf = getRaceAbilityBonuses([
      { key: 'STRENGTH', value: 2 },
      { key: 'CONSTITUTION', value: 2 },
      { key: 'CHOICE', value: 1 },
    ]);

    const withDwarf = replaceRaceBonuses(base, {}, dwarf);
    const withElf = replaceRaceBonuses(withDwarf, dwarf, { DEXTERITY: 2 });

    expect(withDwarf.STRENGTH).toBe(12);
    expect(withElf).toEqual({ ...base, DEXTERITY: 12 });
  });

  it('хиты и кости хитов мультикласса', () => {
    const document = makeDocument({
      abilities: { ...createEmptySheetDocument().abilities, CONSTITUTION: 14 },
      classes: [
        {
          id: 'a',
          name: 'Воин',
          url: null,
          archetypeName: null,
          archetypeUrl: null,
          level: 3,
          hitDie: 10,
        },
        {
          id: 'b',
          name: 'Волшебник',
          url: null,
          archetypeName: null,
          archetypeUrl: null,
          level: 2,
          hitDie: 6,
        },
      ],
      hitDiceUsed: { 10: 2 },
    });

    expect(getSuggestedMaxHitPoints(document)).toBe(12 + 8 * 2 + 6 * 2);

    expect(getHitDiceTotals(document)).toEqual([
      { die: 10, total: 3, used: 2 },
      { die: 6, total: 2, used: 0 },
    ]);
  });

  it('урон сначала снимает временные хиты, долгий отдых восстанавливает', () => {
    const document = makeDocument({
      health: { max: 20, current: 15, temporary: 5 },
      spellSlotsUsed: [2, 1, 0, 0, 0, 0, 0, 0, 0],
    });

    const damaged = applyDamage(document, 8);

    expect(damaged.health).toEqual({ max: 20, current: 12, temporary: 0 });

    const rested = applyLongRest(damaged);

    expect(rested.health.current).toBe(20);
    expect(rested.spellSlotsUsed.every((used) => used === 0)).toBe(true);
  });
});
