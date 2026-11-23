import type { ActiveEffect } from '~active-effects/model';
import type {
  SheetClass,
  SheetDocument,
  SheetItem,
  SheetSource,
} from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  addSources,
  applyLevelUpStep,
  applyMechanicsLongRest,
  applyMechanicsShortRest,
  applyProficiencyGrant,
  buildChoiceContext,
  catalogMechanicsSchema,
  createEmptyGrantedProficiencies,
  createEmptySheetDocument,
  createFormulaContext,
  createSheetItem,
  createSource,
  evaluateFormula,
  getFirstClassMechanics,
  getHitPointGain,
  getMulticlassMechanics,
  getPendingChoices,
  getPreparedLimit,
  getResourceMax,
  getSheetRollMode,
  getSheetStats,
  getSourceChoices,
  getStaticChoiceOptions,
  removeClass,
  removeClassLevel,
  removeProficiencyGrant,
  removeSources,
  setSourceAnswers,
  sheetDocumentSchema,
  toWeaponGroupNames,
} from '~character-sheet/model';

/**
 * Лист с изменёнными полями поверх пустого.
 * @param patch - изменённые поля
 */
function makeDocument(patch: Partial<SheetDocument> = {}): SheetDocument {
  return { ...createEmptySheetDocument(), ...patch };
}

/**
 * Класс листа.
 * @param patch - изменённые поля
 */
function makeClass(patch: Partial<SheetClass> = {}): SheetClass {
  return {
    id: 'class-1',
    name: 'Монах',
    url: '/classes/monk',
    archetypeName: null,
    archetypeUrl: null,
    level: 1,
    hitDie: 8,
    hitPointGains: [],
    ...patch,
  };
}

/**
 * Эффект «на носителе» с изменениями и флагами.
 * @param patch - изменённые поля
 */
function makeEffect(patch: Partial<ActiveEffect>): ActiveEffect {
  return {
    id: 'effect-1',
    name: 'Эффект',
    description: '',
    disabled: false,
    origin: 'feature',
    transfer: false,
    duration: { type: 'permanent' },
    changes: [],
    flags: [],
    ...patch,
  };
}

/**
 * Источник с механикой из сырого блока.
 * @param kind - вид источника
 * @param mechanics - сырой блок механики
 * @param patch - изменённые поля
 */
function makeSource(
  kind: SheetSource['kind'],
  mechanics: unknown,
  patch: Partial<SheetSource> = {},
): SheetSource {
  return {
    ...createSource({
      kind,
      name: kind,
      mechanics: catalogMechanicsSchema.parse(mechanics),
    }),
    ...patch,
  };
}

describe('лист персонажа: совместимость документа', () => {
  it('документ первой версии без полей механики открывается', () => {
    const document = sheetDocumentSchema.parse({
      schemaVersion: 1,
      classes: [
        {
          id: '1',
          name: 'Воин',
          url: '/classes/fighter',
          level: 3,
          hitDie: 10,
        },
      ],
      inventory: [{ id: 'i', name: 'Меч', quantity: 1 }],
      spells: [{ id: 's', name: 'Свет', level: 0 }],
      resources: [{ id: 'r', name: 'Ярость', max: 3, used: 1, reset: 'LONG' }],
      skills: { STEALTH: 'proficient' },
    });

    expect(document.sources).toEqual([]);
    expect(document.proficiencyGrants).toEqual([]);
    expect(document.activeEffects).toEqual([]);
    expect(document.exhaustion).toBe(0);
    expect(document.classes[0]?.hitPointGains).toEqual([]);
    expect(document.inventory[0]?.activeEffects).toEqual([]);
    expect(document.inventory[0]?.charges).toBeNull();
    expect(document.spells[0]?.sourceId).toBeNull();
    expect(document.resources[0]?.formula).toBeNull();
    expect(document.skills.STEALTH).toBe('proficient');
  });

  it('битая механика источника превращается в null, а не роняет лист', () => {
    const document = sheetDocumentSchema.parse({
      sources: [
        { id: 'a', kind: 'feat', name: 'Черта', mechanics: 'мусор' },
        { id: 'b', kind: 'неведомое', name: 'x' },
      ],
    });

    expect(document.sources).toHaveLength(1);
    expect(document.sources[0]?.mechanics).toBeNull();
  });
});

describe('лист персонажа: журнал выдач', () => {
  it('снятие источника не забирает навык, выданный другим', () => {
    const granted = {
      ...createEmptyGrantedProficiencies(),
      skills: ['STEALTH' as const],
    };

    let document = applyProficiencyGrant(makeDocument(), 'a', granted);

    document = applyProficiencyGrant(document, 'b', granted);
    document = removeProficiencyGrant(document, 'a');
    expect(document.skills.STEALTH).toBe('proficient');

    document = removeProficiencyGrant(document, 'b');
    expect(document.skills.STEALTH).toBe('none');
  });

  it('ручное владение источник не снимает, компетентность опускается до владения', () => {
    let document = makeDocument({ skills: { ARCANA: 'proficient' } });

    document = applyProficiencyGrant(document, 'a', {
      ...createEmptyGrantedProficiencies(),
      skills: ['ARCANA'],
      expertise: ['ARCANA'],
    });

    expect(document.skills.ARCANA).toBe('expertise');

    document = removeProficiencyGrant(document, 'a');
    expect(document.skills.ARCANA).toBe('none');

    document = applyProficiencyGrant(
      makeDocument({ skills: { ARCANA: 'proficient' } }),
      'b',
      { ...createEmptyGrantedProficiencies(), expertise: ['ARCANA'] },
    );

    expect(removeProficiencyGrant(document, 'b').skills.ARCANA).toBe(
      'proficient',
    );
  });

  it('спасброски снимаются вместе с источником', () => {
    const document = applyProficiencyGrant(makeDocument(), 'a', {
      ...createEmptyGrantedProficiencies(),
      savingThrows: ['WISDOM'],
    });

    expect(document.savingThrows).toEqual(['WISDOM']);
    expect(removeProficiencyGrant(document, 'a').savingThrows).toEqual([]);
  });

  it('категории оружия читаются группами 2014', () => {
    expect(
      toWeaponGroupNames(['SIMPLE_MELE', 'SIMPLE_RANGED', 'WAR_MELE']),
    ).toEqual(['Простое оружие', 'Воинское рукопашное оружие']);
  });
});

describe('лист персонажа: выборы', () => {
  const classMechanics = {
    proficiencies: {
      savingThrows: ['STRENGTH', 'DEXTERITY'],
      armorCategories: ['LIGHT'],
    },
    choices: [
      {
        key: 'class-skills',
        type: 'SKILL',
        count: 2,
        options: [
          { value: 'STEALTH' },
          { value: 'ATHLETICS' },
          { value: 'HISTORY' },
        ],
      },
    ],
  };

  it('ответ на выбор навыков выдаёт навыки, снятие источника их забирает', () => {
    const source = makeSource('class', classMechanics, { id: 'cls' });

    let document = addSources(makeDocument(), [source]);

    expect(document.savingThrows).toEqual(['STRENGTH', 'DEXTERITY']);
    expect(getPendingChoices(document)).toHaveLength(1);

    document = setSourceAnswers(document, 'cls', 'class-skills', [
      'STEALTH',
      'HISTORY',
    ]);

    expect(document.skills.STEALTH).toBe('proficient');
    expect(getPendingChoices(document)).toHaveLength(0);

    document = setSourceAnswers(document, 'cls', 'class-skills', [
      'ATHLETICS',
      'HISTORY',
    ]);

    expect(document.skills.STEALTH).toBe('none');
    expect(document.skills.ATHLETICS).toBe('proficient');

    document = removeSources(document, ['cls']);
    expect(document.skills.ATHLETICS).toBe('none');
    expect(document.savingThrows).toEqual([]);
  });

  it('варианты помечают уже имеющееся, «только без владения» запрещает его', () => {
    const source = makeSource('feat', {
      choices: [
        { key: 'k', type: 'SKILL', count: 1, onlyIfNotProficient: true },
      ],
    });

    const document = makeDocument({ skills: { STEALTH: 'proficient' } });
    const [choice] = getSourceChoices(source, 1);

    const options = choice
      ? getStaticChoiceOptions(choice, buildChoiceContext(document, source.id))
      : null;

    const stealth = options?.find((option) => option.value === 'STEALTH');

    expect(stealth?.disabled).toBe(true);
    expect(stealth?.hint).toBe('владеет');
  });

  it('«компетентность при владении» превращает выбор в компетентность', () => {
    const source = makeSource(
      'feat',
      {
        choices: [
          { key: 'k', type: 'SKILL', count: 1, expertiseIfProficient: true },
        ],
      },
      { id: 'f' },
    );

    let document = addSources(
      makeDocument({ skills: { STEALTH: 'proficient' } }),
      [source],
    );

    document = setSourceAnswers(document, 'f', 'k', ['STEALTH']);
    expect(document.skills.STEALTH).toBe('expertise');
  });

  it('количество растёт ступенями, выбор открывается с уровня', () => {
    const source = makeSource('classFeature', {
      choices: [
        {
          key: 'a',
          type: 'OPTION',
          count: 2,
          scaling: [
            { level: 5, count: 3 },
            { level: 9, count: 4 },
          ],
        },
        { key: 'b', type: 'SKILL', requiredLevel: 6 },
      ],
    });

    expect(getSourceChoices(source, 2).map((choice) => choice.count)).toEqual([
      2,
    ]);

    expect(getSourceChoices(source, 6).map((choice) => choice.count)).toEqual([
      3, 1,
    ]);
  });

  it('повышения расы складываются: фиксированное и на выбор', () => {
    const race = makeSource(
      'race',
      {
        abilityBonuses: [
          { abilities: ['CHARISMA'], bonus: 2 },
          {
            abilities: ['STRENGTH', 'DEXTERITY', 'WISDOM'],
            bonus: 1,
            count: 2,
          },
        ],
      },
      { id: 'race' },
    );

    let document = addSources(makeDocument(), [race]);

    expect(document.abilities.CHARISMA).toBe(12);

    document = setSourceAnswers(document, 'race', 'ability-bonus:1', [
      'STRENGTH',
      'WISDOM',
    ]);

    expect(document.abilities.STRENGTH).toBe(11);
    expect(document.abilities.WISDOM).toBe(11);

    document = removeSources(document, ['race']);
    expect(document.abilities).toEqual(createEmptySheetDocument().abilities);
  });

  it('повышение черты не поднимает характеристику выше 20', () => {
    const feat = makeSource(
      'feat',
      { abilityBonuses: [{ abilities: ['STRENGTH'], bonus: 1 }] },
      { id: 'f' },
    );

    const base = makeDocument({
      abilities: { ...createEmptySheetDocument().abilities, STRENGTH: 20 },
    });

    const document = addSources(base, [feat]);

    expect(document.abilities.STRENGTH).toBe(20);
    expect(removeSources(document, ['f']).abilities.STRENGTH).toBe(20);
  });
});

describe('лист персонажа: ресурсы', () => {
  it('формула максимума считает мастерство, модификаторы и уровень класса', () => {
    const document = makeDocument({
      classes: [makeClass({ level: 5 })],
      abilities: { ...createEmptySheetDocument().abilities, CHARISMA: 16 },
    });

    const context = createFormulaContext(document);

    expect(evaluateFormula('@prof', context)).toBe(3);
    expect(evaluateFormula('@mod.cha + 1', context)).toBe(4);
    expect(evaluateFormula('@classLevel*2', context, 4)).toBe(8);
    expect(evaluateFormula('1к6', context)).toBeNull();
  });

  it('счётчик источника заводит ресурс, ступени важнее формулы', () => {
    const source = makeSource(
      'classFeature',
      {
        counters: [
          { key: 'ki', name: 'Ци', max: '@classLevel', recovery: 'SHORT_REST' },
          {
            key: 'luck',
            name: 'Удача',
            max: '@prof',
            scaling: [{ level: 3, max: 7 }],
            recovery: 'SHORT_REST_ONE',
          },
        ],
      },
      { classId: 'class-1' },
    );

    const document = addSources(
      makeDocument({ classes: [makeClass({ level: 4 })] }),
      [source],
    );

    const context = createFormulaContext(document);
    const [ki, luck] = document.resources;

    expect(ki && getResourceMax(ki, context)).toBe(4);
    expect(luck && getResourceMax(luck, context)).toBe(7);

    const spent = {
      ...document,
      resources: document.resources.map((resource) => ({
        ...resource,
        used: 3,
      })),
    };

    const rested = applyMechanicsShortRest(spent, () => 0);

    expect(rested.resources.map((resource) => resource.used)).toEqual([0, 2]);
    expect(removeSources(document, [source.id]).resources).toEqual([]);
  });

  it('долгий отдых: половина костей хитов, заряды предметов и истощение', () => {
    const wand: SheetItem = {
      ...createSheetItem('Палочка', '/items/wand'),
      charges: { max: 7, used: 5, recharge: '1к6+1', rechargeEvent: 'DAWN' },
    };

    const document = makeDocument({
      classes: [makeClass({ level: 6 })],
      hitDiceUsed: { 8: 6 },
      inventory: [wand],
      exhaustion: 2,
    });

    const rested = applyMechanicsLongRest(document, 40, () => 4);

    expect(rested.hitDiceUsed['8']).toBe(3);
    expect(rested.health.current).toBe(40);
    expect(rested.inventory[0]?.charges?.used).toBe(1);
    expect(rested.exhaustion).toBe(1);
  });
});

describe('лист персонажа: эффекты', () => {
  const unarmored = makeEffect({
    name: 'Защита без доспехов',
    changes: [
      {
        key: 'armorClass',
        mode: 'upgrade',
        value: '10+@mod.dex+@mod.wis',
        condition: 'self.armor === "none"',
        priority: 20,
      },
    ],
  });

  const base = makeDocument({
    abilities: {
      ...createEmptySheetDocument().abilities,
      DEXTERITY: 16,
      WISDOM: 14,
    },
    sources: [
      { ...makeSource('classFeature', null), activeEffects: [unarmored] },
    ],
  });

  it('«Защита без доспехов» задаёт КД без брони и пропадает в доспехе', () => {
    expect(getSheetStats(base).armorClass).toBe(15);
    expect(getSheetStats(base).armorClassSource).toBe('Защита без доспехов');

    const armored = {
      ...base,
      inventory: [
        {
          ...createSheetItem('Кольчуга', null),
          isEquipped: true,
          armor: {
            category: 'HEAVY' as const,
            baseArmorClass: 16,
            strengthRequirement: null,
            stealthDisadvantage: true,
            bonus: 0,
          },
        },
      ],
    };

    expect(getSheetStats(armored).armorClass).toBe(16);

    expect(getSheetStats(armored).flags.has('skill.stealth.disadvantage')).toBe(
      true,
    );
  });

  it('выключенный эффект умения не действует', () => {
    const [source] = base.sources;

    const disabled = {
      ...base,
      sources: source ? [{ ...source, disabledEffects: ['effect-1'] }] : [],
    };

    expect(getSheetStats(disabled).armorClass).toBe(13);
  });

  it('эффекты прибавляют к спасброскам и характеристикам', () => {
    const document = makeDocument({
      savingThrows: ['WISDOM'],
      activeEffects: [
        makeEffect({
          changes: [
            { key: 'save.wisdom', mode: 'add', value: '1', priority: 20 },
            {
              key: 'ability.strength',
              mode: 'override',
              value: '19',
              priority: 20,
            },
          ],
        }),
      ],
    });

    const stats = getSheetStats(document);

    expect(stats.savingThrows.WISDOM.bonus).toBe(3);
    expect(stats.abilities.STRENGTH).toBe(19);
  });

  it('предмет, требующий настройки, действует только настроенным', () => {
    const ring: SheetItem = {
      ...createSheetItem('Кольцо защиты', null),
      isEquipped: true,
      requiresAttunement: true,
      activeEffects: [
        makeEffect({
          changes: [
            { key: 'armorClass', mode: 'add', value: '1', priority: 20 },
          ],
        }),
      ],
    };

    expect(getSheetStats(makeDocument({ inventory: [ring] })).armorClass).toBe(
      10,
    );

    expect(
      getSheetStats(makeDocument({ inventory: [{ ...ring, isAttuned: true }] }))
        .armorClass,
    ).toBe(11);
  });

  it('истощение 2014: помеха проверкам, половина скорости, половина хитов, скорость 0', () => {
    const document = makeDocument({
      speed: 30,
      health: { max: 20, current: 20, temporary: 0 },
    });

    const first = getSheetStats({ ...document, exhaustion: 1 });

    expect(
      getSheetRollMode(first.flags, { kind: 'skill', skill: 'stealth' }),
    ).toBe('disadvantage');

    expect(getSheetStats({ ...document, exhaustion: 2 }).speeds.walk).toBe(15);
    expect(getSheetStats({ ...document, exhaustion: 4 }).hitPointsMax).toBe(10);
    expect(getSheetStats({ ...document, exhaustion: 5 }).speeds.walk).toBe(0);
  });

  it('модификаторы источников: скорость, чувства, защиты, хиты', () => {
    const document = addSources(
      makeDocument({
        speed: 30,
        classes: [makeClass({ level: 4 })],
        health: { max: 30, current: 30, temporary: 0 },
      }),
      [
        makeSource(
          'feat',
          {
            modifiers: {
              speed: { walkBonus: 10, climbEqualsWalk: true },
              senses: [{ type: 'DARKVISION', range: 60 }],
              damage: {
                resistances: ['FAIR'],
                defenseChoices: [{ choiceKey: 'dmg', kind: 'IMMUNITY' }],
              },
              hitPoints: {
                perAcquisitionLevel: 1,
                perLevelAfterAcquisition: 1,
              },
              conditionImmunities: ['POISONED'],
            },
          },
          { characterLevel: 2, choiceAnswers: { dmg: ['COLD'] } },
        ),
      ],
    );

    const stats = getSheetStats(document);

    expect(stats.speeds.walk).toBe(40);
    expect(stats.speeds.climb).toBe(40);

    expect(stats.senses).toEqual([
      { key: 'DARKVISION', label: 'Тёмное зрение', range: 60 },
    ]);

    expect(stats.defences.resistances).toEqual(['Огонь']);
    expect(stats.defences.immunities).toEqual(['Холод']);
    expect(stats.defences.conditionImmunities).toEqual(['Отравленный']);
    expect(stats.hitPointsMax).toBe(34);
  });
});

describe('лист персонажа: уровни', () => {
  it('прирост хитов: первый уровень — максимум, дальше среднее, бросок, максимум', () => {
    expect(getHitPointGain('average', 10, 2, null, true)).toBe(12);
    expect(getHitPointGain('average', 10, 2, null, false)).toBe(8);
    expect(getHitPointGain('roll', 10, -3, 1, false)).toBe(1);
    expect(getHitPointGain('max', 8, 1, null, false)).toBe(9);
  });

  it('механика первого класса собирается из текста, мультикласс — по таблице PHB', () => {
    const first = getFirstClassMechanics(null, {
      savingThrows: ['STRENGTH', 'CONSTITUTION'],
      skills: ['ATHLETICS', 'SURVIVAL'],
      skillCount: 2,
    });

    expect(first?.proficiencies?.savingThrows).toEqual([
      'STRENGTH',
      'CONSTITUTION',
    ]);

    expect(first?.choices?.[0]?.key).toBe('class-skills');

    const multi = getMulticlassMechanics('/classes/rogue', null, {
      savingThrows: [],
      skills: ['STEALTH'],
      skillCount: 4,
    });

    expect(multi?.proficiencies?.armorCategories).toEqual(['LIGHT']);
    expect(multi?.proficiencies?.savingThrows ?? []).toEqual([]);
    expect(multi?.choices?.[0]?.count).toBe(1);
  });

  it('повышение и снятие уровня: хиты, умения и ресурсы уровня уходят', () => {
    const sheetClass = makeClass({ id: 'm', level: 1 });

    const classSource = makeSource(
      'class',
      { proficiencies: { savingThrows: ['DEXTERITY'] } },
      { classId: 'm', level: 1 },
    );

    let document = applyLevelUpStep(makeDocument(), {
      classId: 'm',
      newClass: sheetClass,
      classLevel: 1,
      hitPointGain: 9,
      subclass: null,
      sources: [classSource],
    });

    document = applyLevelUpStep(document, {
      classId: 'm',
      newClass: null,
      classLevel: 2,
      hitPointGain: 6,
      subclass: null,
      sources: [
        makeSource(
          'classFeature',
          { counters: [{ key: 'ki', name: 'Ци', max: '@classLevel' }] },
          { classId: 'm', level: 2 },
        ),
      ],
    });

    expect(document.classes[0]?.level).toBe(2);
    expect(document.health.max).toBe(15);
    expect(document.resources).toHaveLength(1);

    document = removeClassLevel(document, 'm');
    expect(document.classes[0]?.level).toBe(1);
    expect(document.health.max).toBe(9);
    expect(document.resources).toEqual([]);
    expect(document.savingThrows).toEqual(['DEXTERITY']);

    document = removeClass(document, 'm');
    expect(document.classes).toEqual([]);
    expect(document.savingThrows).toEqual([]);
    expect(document.health.max).toBe(0);
    expect(document.sources).toEqual([]);
  });
});

describe('лист персонажа: подготовленные заклинания', () => {
  it('жрец: модификатор + уровень, паладин: + половина, свой предел важнее', () => {
    const document = makeDocument();

    expect(
      getPreparedLimit(
        document,
        [{ url: '/classes/cleric', level: 5, knownSpells: null }],
        16,
      ).value,
    ).toBe(8);

    expect(
      getPreparedLimit(
        document,
        [{ url: '/classes/paladin', level: 5, knownSpells: null }],
        14,
      ).value,
    ).toBe(4);

    expect(
      getPreparedLimit(
        document,
        [{ url: '/classes/bard', level: 3, knownSpells: 6 }],
        16,
      ),
    ).toMatchObject({ value: 6, isKnown: true });

    expect(
      getPreparedLimit({ ...document, preparedLimitOverride: 2 }, [], null)
        .value,
    ).toBe(2);
  });
});
