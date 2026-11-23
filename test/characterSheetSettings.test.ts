import type { SheetDocument } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  ABILITY_BONUS_KINDS,
  createCustomBonus,
  createEmptySheetDocument,
  describeAbilityScore,
  formatModifier,
  getCustomBonusSourceOptions,
  getSavingThrowDrafts,
  getSheetStats,
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

describe('бонусы к характеристикам', () => {
  it('свой бонус поднимает значение и всё, что от него зависит', () => {
    const document = makeDocument({
      abilities: ABILITIES,
      skills: { ATHLETICS: 'none' },
      abilityBonuses: {
        STRENGTH: [{ ...createCustomBonus('b1'), value: 11, label: 'Пояс' }],
      },
    });

    const stats = getSheetStats(document);

    // 8 + 11 = 19 → +4
    expect(stats.abilities.STRENGTH).toBe(19);
    expect(stats.skills.ATHLETICS).toBe(4);
    expect(stats.savingThrows.STRENGTH.bonus).toBe(4);
  });

  it('среди источников нет модификаторов характеристик', () => {
    const values = getCustomBonusSourceOptions([], ABILITY_BONUS_KINDS).map(
      (option) => option.value,
    );

    expect(values).toEqual(['flat', 'proficiency', 'level']);
  });

  it('разбор значения: записанное, бонусы и остаток эффектов', () => {
    expect(
      describeAbilityScore(
        14,
        17,
        [{ label: 'Пояс', value: 1 }],
        formatModifier,
      ),
    ).toBe('Записано 14 · Пояс +1 · Эффекты +2');

    expect(describeAbilityScore(14, 14, [], formatModifier)).toBe('');
  });
});

describe('настройка спасбросков', () => {
  it('подменённая характеристика, свои и общие бонусы входят в итог', () => {
    const document = makeDocument({
      abilities: ABILITIES,
      savingThrows: ['WISDOM'],
      savingThrowAbilities: { WISDOM: 'INTELLIGENCE' },
      savingThrowBonuses: {
        WISDOM: [{ ...createCustomBonus('b1'), value: 2 }],
      },
      savingThrowCommonBonuses: [{ ...createCustomBonus('b2'), value: 1 }],
    });

    const stats = getSheetStats(document);

    // Интеллект +3, мастерство, свой +2 и общий +1
    expect(stats.savingThrows.WISDOM.bonus).toBe(
      3 + stats.proficiencyBonus + 2 + 1,
    );

    // Общий бонус идёт и в спасбросок без своих настроек
    expect(stats.savingThrows.DEXTERITY.bonus).toBe(2 + 1);
  });

  it('черновики копируют бонусы, а не ссылаются на лист', () => {
    const bonus = createCustomBonus('b1');

    const document = makeDocument({
      savingThrows: ['CONSTITUTION'],
      savingThrowBonuses: { CONSTITUTION: [bonus] },
    });

    const drafts = getSavingThrowDrafts(document);
    const constitution = drafts.find((draft) => draft.key === 'CONSTITUTION');

    expect(constitution?.isProficient).toBe(true);
    expect(constitution?.ability).toBe('CONSTITUTION');
    expect(constitution?.bonuses[0]).not.toBe(bonus);
    expect(constitution?.bonuses[0]).toEqual(bonus);
  });

  it('старый лист без новых полей читается с пустыми настройками', () => {
    const document = createEmptySheetDocument();

    expect(document.abilityBonuses).toEqual({});
    expect(document.savingThrowAbilities).toEqual({});
    expect(document.savingThrowBonuses).toEqual({});
    expect(document.savingThrowCommonBonuses).toEqual([]);
  });
});
