import type { SheetDocument } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  createCustomBonus,
  createEmptySheetDocument,
  getCustomBonusSource,
  getSheetStats,
  getSkillRowGroups,
  hasSkillName,
  withCustomBonusSource,
} from '~character-sheet/model';

/**
 * Лист с правками поверх пустого.
 * @param patch - правки
 */
function makeDocument(patch: Partial<SheetDocument> = {}): SheetDocument {
  return { ...createEmptySheetDocument(), ...patch };
}

const ABILITIES = {
  STRENGTH: 8,
  DEXTERITY: 14,
  CONSTITUTION: 12,
  INTELLIGENCE: 16,
  WISDOM: 10,
  CHARISMA: 12,
};

describe('настройка навыков', () => {
  it('подменённая характеристика и свои бонусы входят в итог навыка', () => {
    const document = makeDocument({
      abilities: ABILITIES,
      skills: { ATHLETICS: 'proficient' },
      skillAbilities: { ATHLETICS: 'DEXTERITY' },
      skillBonuses: {
        ATHLETICS: [
          { ...createCustomBonus('b1'), value: 1 },
          {
            ...createCustomBonus('b2'),
            kind: 'ability',
            ability: 'INTELLIGENCE',
          },
        ],
      },
    });

    // Лов +2, мастерство +2 (без классов — 1 уровень), +1, мод. Инт +3
    expect(getSheetStats(document).skills.ATHLETICS).toBe(8);
  });

  it('свой навык считается по своей характеристике и владению', () => {
    const document = makeDocument({
      abilities: ABILITIES,
      customSkills: [
        {
          id: 'c1',
          name: 'Алхимия',
          ability: 'INTELLIGENCE',
          proficiency: 'expertise',
          bonuses: [],
        },
      ],
    });

    expect(getSheetStats(document).customSkills.c1).toBe(7);
  });

  it('источник бонуса переключается без потери своего числа', () => {
    const bonus = { ...createCustomBonus('b'), value: 3 };
    const byClass = withCustomBonusSource(bonus, 'class:k1');

    expect(byClass.kind).toBe('classLevel');
    expect(byClass.classId).toBe('k1');
    expect(getCustomBonusSource(byClass)).toBe('class:k1');
    expect(withCustomBonusSource(byClass, 'flat').value).toBe(3);
    expect(withCustomBonusSource(byClass, 'WISDOM').ability).toBe('WISDOM');
  });

  it('группировка раскладывает навыки по характеристикам в порядке листа', () => {
    const groups = getSkillRowGroups(
      [
        { name: 'Скрытность', ability: 'DEXTERITY' as const },
        { name: 'Атлетика', ability: 'STRENGTH' as const },
      ],
      true,
    );

    expect(groups.map((group) => group.title)).toEqual(['Сила', 'Ловкость']);
    expect(getSkillRowGroups([], false)[0]?.title).toBeNull();
  });

  it('дубль названия навыка находится без учёта регистра', () => {
    expect(hasSkillName(['Атлетика'], ' атлетика ')).toBe(true);
    expect(hasSkillName(['Атлетика'], 'Алхимия')).toBe(false);
  });

  it('старый лист без настроек открывается с пустыми значениями', () => {
    const document = createEmptySheetDocument();

    expect(document.skillAbilities).toEqual({});
    expect(document.customSkills).toEqual([]);
    expect(document.groupSkillsByAbility).toBe(false);
  });
});
