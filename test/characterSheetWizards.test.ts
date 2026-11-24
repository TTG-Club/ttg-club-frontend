import type { SheetDocument } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  addSources,
  applyCustomClass,
  catalogMechanicsSchema,
  createEmptySheetDocument,
  createSource,
  getClassSpellGrowth,
  getMulticlassWarning,
  getWizardGrantRows,
  withChoiceOptionDetail,
} from '~character-sheet/model';

/**
 * Лист с заданными значениями характеристик.
 * @param scores - значения, остальные — 10
 */
function makeDocument(
  scores: Partial<SheetDocument['abilities']> = {},
): SheetDocument {
  const document = createEmptySheetDocument();

  return { ...document, abilities: { ...document.abilities, ...scores } };
}

describe('мастера листа: итог', () => {
  it('«Что даёт» собирает прибавки и владения добавленных источников', () => {
    const source = createSource({
      kind: 'race',
      name: 'Горный дварф',
      url: '/races/dwarf/mountain',
      characterLevel: 1,
      mechanics: catalogMechanicsSchema.parse({
        abilityBonuses: [{ abilities: ['STRENGTH'], bonus: 2 }],
        proficiencies: {
          armorCategories: ['LIGHT', 'MEDIUM'],
          languages: ['COMMON', 'DWARVISH'],
        },
      }),
    });

    const document = addSources(makeDocument(), [source]);
    const rows = getWizardGrantRows(document, [source.id]);

    expect(rows.map((row) => row.key)).toEqual([
      'abilities',
      'armor',
      'languages',
    ]);

    expect(rows[0]?.values).toEqual(['Сила +2']);
    expect(rows[1]?.values).toEqual(['Лёгкие доспехи', 'Средние доспехи']);
  });

  it('чужие источники в итог не попадают', () => {
    const own = createSource({
      kind: 'background',
      name: 'Прислужник',
      characterLevel: 1,
      mechanics: catalogMechanicsSchema.parse({
        proficiencies: { skills: ['INSIGHT', 'RELIGION'] },
      }),
    });

    const other = createSource({
      kind: 'feat',
      name: 'Чужая черта',
      characterLevel: 1,
      mechanics: catalogMechanicsSchema.parse({
        proficiencies: { skills: ['STEALTH'] },
      }),
    });

    const document = addSources(makeDocument(), [own, other]);

    expect(getWizardGrantRows(document, [own.id])).toEqual([
      {
        key: 'skills',
        label: 'Навыки',
        values: ['Проницательность', 'Религия'],
      },
    ]);
  });
});

describe('мастер класса: мультиклассирование 2014', () => {
  const withFighter = (document: SheetDocument): SheetDocument => ({
    ...document,
    classes: [
      {
        id: 'f',
        name: 'Воин',
        url: '/classes/fighter',
        archetypeName: null,
        archetypeUrl: null,
        level: 3,
        hitDie: 10,
        hitPointGains: [],
        spellcastingAbility: null,
      },
    ],
  });

  it('первый класс условий не требует', () => {
    expect(getMulticlassWarning(makeDocument(), '/classes/wizard')).toBeNull();
  });

  it('нужны условия и нового класса, и уже взятого', () => {
    const document = withFighter(makeDocument({ STRENGTH: 15 }));

    expect(getMulticlassWarning(document, '/classes/wizard')).toContain(
      'Интеллект',
    );

    expect(
      getMulticlassWarning(
        withFighter(makeDocument({ DEXTERITY: 9, INTELLIGENCE: 13 })),
        '/classes/wizard',
      ),
    ).toContain('Сила или Ловкость');

    expect(
      getMulticlassWarning(
        withFighter(makeDocument({ STRENGTH: 13, INTELLIGENCE: 14 })),
        '/classes/wizard',
      ),
    ).toBeNull();
  });
});

describe('мастер уровня: заклинания шага', () => {
  const bard = {
    traits: {
      levels: [
        { spellSlots: ['2'] },
        { spellSlots: ['3'] },
        { spellSlots: ['4', '2'] },
      ],
    },
    tableColumns: [
      { name: 'Известные заговоры', levels: [2, 2, 2] },
      { name: 'Известные заклинания', levels: [4, 5, 6] },
    ],
  };

  it('прирост известных и наибольший круг ячеек', () => {
    expect(getClassSpellGrowth(bard, null, 1)).toEqual({
      cantrips: 2,
      spells: 4,
      maxLevel: 1,
    });

    expect(getClassSpellGrowth(bard, null, 3)).toEqual({
      cantrips: 0,
      spells: 1,
      maxLevel: 2,
    });
  });
});

describe('свой класс', () => {
  it('первый класс: хиты, спасброски, навыки и умения', () => {
    const next = applyCustomClass(makeDocument({ CONSTITUTION: 14 }), {
      name: 'Охотник за бурями',
      subclassName: 'Путь грома',
      hitDie: 10,
      savingThrows: ['STRENGTH', 'CONSTITUTION'],
      skills: ['ATHLETICS'],
      spellcastingAbility: 'WISDOM',
      features: [
        { name: 'Буревестник', description: 'Текст' },
        { name: '  ', description: '' },
      ],
    });

    const [sheetClass] = next.classes;

    expect(sheetClass).toMatchObject({
      name: 'Охотник за бурями',
      archetypeName: 'Путь грома',
      url: null,
      level: 1,
      hitDie: 10,
      spellcastingAbility: 'WISDOM',
    });

    expect(next.proficiencyGrants[0]).toMatchObject({
      skills: ['ATHLETICS'],
      savingThrows: ['STRENGTH', 'CONSTITUTION'],
    });

    expect(next.features).toHaveLength(1);

    expect(next.features[0]).toMatchObject({
      name: 'Буревестник',
      origin: 'class',
    });
  });
});

describe('окно выбора: описание и группы вариантов', () => {
  it('особенность класса описывается карточкой раздела', () => {
    expect(
      withChoiceOptionDetail('option', {
        value: '/options/agonizing_blast',
        label: 'Мучительный взрыв',
      }).detail,
    ).toEqual({ type: 'option', path: '/options/agonizing_blast' });
  });

  it('навыки группируются по характеристике, у них нет описания', () => {
    const option = withChoiceOptionDetail('skill', {
      value: 'STEALTH',
      label: 'Скрытность',
    });

    expect(option.group).toBe('Ловкость');
    expect(option.detail).toBeUndefined();
  });

  it('инструмент из поиска описывается по адресу записи', () => {
    expect(
      withChoiceOptionDetail(
        'tool',
        { value: 'Воровские инструменты', label: 'Воровские инструменты' },
        '/items/thieves-tools',
      ).detail,
    ).toEqual({ type: 'item', path: '/items/thieves-tools' });
  });
});
