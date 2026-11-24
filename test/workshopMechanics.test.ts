import { describe, expect, it } from 'vitest';

import {
  createEmptyActiveEffect,
  EFFECT_FORM_CONTEXT,
  EFFECT_ORIGIN,
} from '~active-effects/model';
import {
  createArchetypeForm,
  createBackgroundForm,
  createChoiceForm,
  createClassForm,
  createCounterForm,
  createFeatForm,
  createMagicItemForm,
  createMechanicsForm,
  createOptionForm,
  createRaceFeature,
  createRaceForm,
  featFormSchema,
  getActiveEffectsPayload,
  getArchetypePayload,
  getBackgroundPayload,
  getClassPayload,
  getFeatPayload,
  getMagicItemEffectActivation,
  getMagicItemEffectContext,
  getMagicItemPayload,
  getMechanicsFilledCount,
  getMechanicsPayload,
  getOptionPayload,
  getRacePayload,
  MECHANICS_KIND,
  parseMagicItemMechanicsForm,
  parseMechanicsForm,
  parseWorkshopArchetype,
  parseWorkshopBackground,
  parseWorkshopClass,
  parseWorkshopFeat,
  parseWorkshopMagicItem,
  parseWorkshopOption,
  parseWorkshopRace,
} from '~workshop/model';

/** Механика черты в том виде, в каком её хранит бэкенд. */
const FEAT_MECHANICS = {
  abilityBonuses: [
    { abilities: ['STRENGTH', 'DEXTERITY'], bonus: 1, upto: 20 },
  ],
  proficiencies: {
    weaponCategories: ['WAR_MELE'],
    weapons: [{ url: 'longsword', name: 'Длинный меч' }],
    armorCategories: ['SHIELD'],
    savingThrows: ['CONSTITUTION'],
    skills: ['PERCEPTION'],
    tools: [{ url: 'thieves-tools' }],
    languages: ['Celestial', 'DWARVISH'],
  },
  choices: [
    {
      key: 'damage-type',
      type: 'DAMAGE_TYPE',
      label: 'Выберите тип урона',
      options: [
        { value: 'FAIR', name: 'Огонь' },
        { value: 'COLD', name: 'Холод' },
      ],
    },
    {
      key: 'spell',
      type: 'SPELL',
      types: ['SPELL', 'CANTRIP'],
      count: 2,
      spellFilter: { level: 0, schools: ['EVOCATION'], castingTime: 'ACTION' },
      scaling: [{ level: 5, count: 3 }],
      alwaysPrepared: true,
    },
  ],
  modifiers: {
    hitPoints: { perAcquisitionLevel: 2 },
    speed: { walkBonus: 10, flyEqualsWalk: true },
    armorClassBonus: 1,
    senses: [{ type: 'DARKVISION', range: 60 }],
    damage: {
      resistances: ['FAIR', 'NECTOTIC'],
      defenseChoices: [{ choiceKey: 'damage-type', kind: 'RESISTANCE' }],
    },
    conditionImmunities: ['CHARMED'],
    initiativeBonus: 5,
  },
  counters: [
    {
      key: 'luck-points',
      name: 'Очки удачи',
      max: '@prof',
      shortRest: { mode: 'NONE' },
      longRest: { mode: 'ALL' },
    },
  ],
  spells: {
    spells: [{ url: 'misty-step', name: 'Туманный шаг', requiredLevel: 3 }],
    spellcastingAbility: 'CHARISMA',
  },
  spellList: {
    groups: [{ requiredLevel: 5, count: '@prof', spells: [{ url: 'bless' }] }],
  },
};

describe('механика мастерской: разбор и тело запроса', () => {
  it('переживает разбор и сборку без потерь', () => {
    const form = parseMechanicsForm(FEAT_MECHANICS);

    expect(getMechanicsPayload(form, MECHANICS_KIND.feat)).toEqual(
      FEAT_MECHANICS,
    );
  });

  it('отправляет только блоки модели своего вида', () => {
    const form = parseMechanicsForm({
      ...FEAT_MECHANICS,
      feats: [{ url: 'alert', name: 'Бдительный' }],
    });

    const classPayload = getMechanicsPayload(form, MECHANICS_KIND.class);
    const racePayload = getMechanicsPayload(form, MECHANICS_KIND.race);

    expect(classPayload.abilityBonuses).toBeUndefined();
    expect(classPayload.feats).toEqual([{ url: 'alert', name: 'Бдительный' }]);
    expect(racePayload.spells).toBeUndefined();
    expect(racePayload.abilityBonuses).toEqual(FEAT_MECHANICS.abilityBonuses);
    expect(getMechanicsFilledCount(form, MECHANICS_KIND.race)).toBe(6);
  });

  it('пустая и битая механика — пустая форма и пустой объект', () => {
    expect(parseMechanicsForm(null)).toEqual(createMechanicsForm());
    expect(parseMechanicsForm('мусор')).toEqual(createMechanicsForm());

    expect(
      getMechanicsPayload(createMechanicsForm(), MECHANICS_KIND.class),
    ).toEqual({});
  });

  it('битое поле не роняет соседей', () => {
    const form = parseMechanicsForm({
      modifiers: { armorClassBonus: 'много', initiativeBonus: 2 },
      proficiencies: { skills: ['PERCEPTION', 'FLYING', 7] },
      choices: [42, { key: 'skill', type: 'SKILL' }],
    });

    expect(form.modifiers.armorClassBonus).toBeNull();
    expect(form.modifiers.initiativeBonus).toBe(2);
    expect(form.proficiencies.skills).toEqual(['PERCEPTION']);
    expect(form.choices).toHaveLength(1);
  });

  it('переводит легаси-поля в текущую форму', () => {
    const form = parseMechanicsForm({
      counters: [{ key: 'ki', name: 'Ци', max: 2, recovery: 'SHORT_REST_ONE' }],
      modifiers: { damage: { resistanceFromChoiceKey: 'damage-type' } },
      spellList: { spells: [{ url: 'bless', name: 'Благословение' }] },
    });

    const payload = getMechanicsPayload(form, MECHANICS_KIND.class);

    expect(payload.counters).toEqual([
      {
        key: 'ki',
        name: 'Ци',
        max: '2',
        shortRest: { mode: 'AMOUNT', amount: 1 },
        longRest: { mode: 'ALL' },
      },
    ]);

    expect(payload.modifiers).toEqual({
      damage: {
        defenseChoices: [{ choiceKey: 'damage-type', kind: 'RESISTANCE' }],
      },
    });

    expect(payload.spellList).toEqual({
      groups: [{ spells: [{ url: 'bless', name: 'Благословение' }] }],
    });
  });

  it('не отправляет незаполненные строки', () => {
    const form = createMechanicsForm();

    form.choices = [createChoiceForm([])];
    form.counters = [{ ...createCounterForm([]), max: '' }];
    form.proficiencies.tools = [{ url: ' ', name: 'Без адреса' }];

    expect(getMechanicsPayload(form, MECHANICS_KIND.feat)).toEqual({});
  });

  it('новым выборам и ресурсам даёт свободные ключи', () => {
    expect(createChoiceForm(['choice-1']).key).toBe('choice-2');
    expect(createCounterForm([]).key).toBe('counter-1');
    expect(createCounterForm([]).max).toBe('@prof');
  });

  it('фильтр заклинаний уходит только у выбора заклинания', () => {
    const form = parseMechanicsForm({
      choices: [{ key: 'skill', type: 'SKILL', spellFilter: { level: 1 } }],
    });

    expect(getMechanicsPayload(form, MECHANICS_KIND.feat)).toEqual({
      choices: [{ key: 'skill', type: 'SKILL' }],
    });
  });
});

describe('механика и эффекты в теле запроса редакторов', () => {
  const EFFECT = {
    ...createEmptyActiveEffect(
      EFFECT_ORIGIN.feature,
      EFFECT_FORM_CONTEXT.feature,
    ),
    name: 'Бдительность',
  };

  it('черта: загруженные механика и эффекты уходят обратно', () => {
    const feat = parseWorkshopFeat({
      id: 3,
      name: { rus: 'Бдительный', eng: 'Alert' },
      description: ['Текст'],
      mechanics: FEAT_MECHANICS,
      activeEffects: [EFFECT],
    });

    const payload = getFeatPayload(createFeatForm(feat), undefined);

    expect(payload.mechanics).toEqual(FEAT_MECHANICS);
    expect(payload.activeEffects).toMatchObject([{ name: 'Бдительность' }]);
  });

  it('черта: снятые механика и эффекты уходят пустыми, а не пропадают', () => {
    const feat = parseWorkshopFeat({
      id: 3,
      name: { rus: 'Бдительный', eng: 'Alert' },
      mechanics: FEAT_MECHANICS,
      activeEffects: [EFFECT],
    });

    const form = createFeatForm(feat);

    form.mechanics = createMechanicsForm();
    form.activeEffects = [];

    const payload = getFeatPayload(form, undefined);

    expect(payload.mechanics).toEqual({});
    expect(payload.activeEffects).toEqual([]);
  });

  it('форма — копия: правка не меняет открытую запись', () => {
    const feat = parseWorkshopFeat({
      id: 3,
      name: { rus: 'Бдительный', eng: 'Alert' },
      mechanics: FEAT_MECHANICS,
    });

    const form = createFeatForm(feat);

    form.mechanics.modifiers.armorClassBonus = 3;

    expect(feat.mechanics.modifiers.armorClassBonus).toBe(1);
  });

  it('проверенная схемой форма сохраняет механику и эффекты', () => {
    const form = createFeatForm(
      parseWorkshopFeat({
        id: 3,
        name: { rus: 'Бдительный', eng: 'Alert' },
        description: ['Текст'],
        mechanics: FEAT_MECHANICS,
        activeEffects: [EFFECT],
      }),
    );

    const validated = featFormSchema.parse(form);

    expect(getFeatPayload(validated, undefined).mechanics).toEqual(
      FEAT_MECHANICS,
    );

    expect(validated.activeEffects).toHaveLength(1);
  });

  it('новая запись отправляет пустые механику и эффекты', () => {
    expect(getOptionPayload(createOptionForm(), undefined)).toMatchObject({
      mechanics: {},
      activeEffects: [],
    });

    expect(
      getBackgroundPayload(createBackgroundForm(), undefined),
    ).toMatchObject({ mechanics: {}, activeEffects: [] });
  });

  it('особенность и предыстория разбирают механику своего вида', () => {
    const option = parseWorkshopOption({
      id: 1,
      name: { rus: 'Вариант', eng: 'Option' },
      mechanics: { feats: [{ url: 'alert' }], abilityBonuses: [{ bonus: 1 }] },
    });

    expect(
      getOptionPayload(createOptionForm(option), undefined).mechanics,
    ).toEqual({ feats: [{ url: 'alert' }] });

    const background = parseWorkshopBackground({
      id: 2,
      name: { rus: 'Отшельник', eng: 'Hermit' },
      mechanics: { proficiencies: { skills: ['MEDICINE'] } },
    });

    expect(
      getBackgroundPayload(createBackgroundForm(background), undefined)
        .mechanics,
    ).toEqual({ proficiencies: { skills: ['MEDICINE'] } });
  });

  it('класс: механика класса и каждого умения', () => {
    const heroClass = parseWorkshopClass({
      id: 1,
      name: { rus: 'Монах', eng: 'Monk' },
      mechanics: { proficiencies: { savingThrows: ['STRENGTH'] } },
      activeEffects: [EFFECT],
      classTraits: [
        {
          id: 5,
          name: 'Ци',
          level: 2,
          description: ['Текст'],
          mechanics: { counters: FEAT_MECHANICS.counters },
        },
        { id: 6, name: 'Без механики', level: 3, description: ['Текст'] },
      ],
    });

    const payload = getClassPayload(createClassForm(heroClass), undefined);

    expect(payload.mechanics).toEqual({
      proficiencies: { savingThrows: ['STRENGTH'] },
    });

    expect(payload.activeEffects).toHaveLength(1);

    expect(payload.classTraits).toMatchObject([
      {
        id: 5,
        mechanics: { counters: FEAT_MECHANICS.counters },
        activeEffects: [],
      },
      { id: 6, mechanics: {}, activeEffects: [] },
    ]);
  });

  it('архетип: механика архетипа и его умений', () => {
    const archetype = parseWorkshopArchetype({
      id: 9,
      name: 'Чемпион',
      englishName: 'Champion',
      level: 3,
      mechanics: { modifiers: { armorClassBonus: 1 } },
      traits: [
        {
          id: 11,
          name: 'Улучшенный критический удар',
          level: 3,
          description: ['Текст'],
          activeEffects: [EFFECT],
        },
      ],
    });

    const payload = getArchetypePayload(
      createArchetypeForm(archetype),
      archetype,
    );

    expect(payload.mechanics).toEqual({ modifiers: { armorClassBonus: 1 } });
    expect(payload.activeEffects).toEqual([]);

    expect(payload.traits).toMatchObject([
      { id: 11, mechanics: {}, activeEffects: [{ name: 'Бдительность' }] },
    ]);
  });

  it('раса: повышения характеристик и механика особенностей', () => {
    const race = parseWorkshopRace({
      id: 4,
      name: { rus: 'Дварф', eng: 'Dwarf' },
      mechanics: {
        abilityBonuses: [{ abilities: ['CONSTITUTION'], bonus: 2 }],
      },
      features: [
        {
          id: 12,
          name: 'Тёмное зрение',
          description: ['Текст'],
          mechanics: {
            modifiers: { senses: [{ type: 'DARKVISION', range: 60 }] },
          },
        },
      ],
    });

    const form = createRaceForm(race);

    form.features = [...form.features, createRaceFeature()];

    const payload = getRacePayload(form, undefined);

    expect(payload.mechanics).toEqual({
      abilityBonuses: [{ abilities: ['CONSTITUTION'], bonus: 2 }],
    });

    expect(payload.features).toMatchObject([
      {
        id: 12,
        mechanics: {
          modifiers: { senses: [{ type: 'DARKVISION', range: 60 }] },
        },
        activeEffects: [],
      },
      { mechanics: {}, activeEffects: [] },
    ]);
  });

  it('эффекты без названия не отправляются', () => {
    expect(getActiveEffectsPayload([{ ...EFFECT, name: '' }])).toEqual([]);
  });
});

describe('механика магического предмета', () => {
  const MECHANICS = {
    activation: 'CONSUMED',
    activeEffects: [
      {
        ...createEmptyActiveEffect(
          EFFECT_ORIGIN.item,
          EFFECT_FORM_CONTEXT.item,
        ),
        name: 'Лечение',
      },
    ],
    resource: {
      maxCharges: 7,
      recharge: '1к6+1',
      rechargeEvent: 'DAWN',
      cost: 1,
    },
    passive: 'Светится',
  };

  it('загруженная механика уходит обратно', () => {
    const item = parseWorkshopMagicItem({
      id: 10,
      name: { rus: 'Жезл', eng: 'Wand' },
      rarityRaw: 'RARE',
      typeRaw: 'WAND',
      mechanics: MECHANICS,
    });

    const payload = getMagicItemPayload(createMagicItemForm(item), undefined);

    expect(payload.mechanics).toMatchObject({
      ...MECHANICS,
      activeEffects: [{ name: 'Лечение' }],
    });
  });

  it('снятая механика уходит пустым объектом, заряды без максимума — нет', () => {
    const form = createMagicItemForm();

    form.mechanics.resource.recharge = '1к6';

    expect(getMagicItemPayload(form, undefined).mechanics).toEqual({});
  });

  it('битая механика — пустая форма', () => {
    expect(parseMagicItemMechanicsForm({ activation: 'FLYING' })).toEqual({
      activation: undefined,
      activeEffects: [],
      resource: {
        maxCharges: null,
        recharge: '',
        rechargeEvent: undefined,
        cost: null,
      },
      passive: '',
    });
  });

  it('место и применение эффектов зависят от предмета', () => {
    expect(getMagicItemEffectContext('MELE_WEAPON')).toBe('weapon');
    expect(getMagicItemEffectContext('RING')).toBe('item');
    expect(getMagicItemEffectActivation('MANUAL')).toBe('use');
    expect(getMagicItemEffectActivation('WORN')).toBeUndefined();
  });
});
