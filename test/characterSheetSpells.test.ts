import type {
  PreparedClassInput,
  SheetDocument,
  SheetSource,
  SheetSpell,
} from '~character-sheet/model';
import type { SpellDamageData, SpellDetail } from '~character/model';
import type { FilterDefinition } from '~section/model';

import { describe, expect, it } from 'vitest';

import {
  copySpellAsCustom,
  createEmptySheetDocument,
  createSheetSpell,
  createSpellCatalogPreset,
  formatPreparedValue,
  getCantripMultiplier,
  getDescriptionText,
  getPreparedBreakdown,
  getSpellDamageTiles,
  getSpellListLevels,
  getSpellOrigin,
  getSpellSlotOptions,
  matchesSpellFilter,
  spendSpellSlot,
  takesPreparationSpace,
} from '~character-sheet/model';
import { createSpellDamageForm, getSpellDamagePayload } from '~workshop/model';

/**
 * Лист с правками поверх пустого.
 * @param patch - правки
 */
function makeDocument(patch: Partial<SheetDocument> = {}): SheetDocument {
  return { ...createEmptySheetDocument(), ...patch };
}

/**
 * Заклинание с правками поверх пустого.
 * @param patch - правки
 */
function makeSpell(patch: Partial<SheetSpell> = {}): SheetSpell {
  return { ...createSheetSpell('Заклинание', '/spells/test'), ...patch };
}

/**
 * Источник механики нужного вида.
 * @param id - идентификатор
 * @param kind - вид источника
 */
function makeSource(id: string, kind: SheetSource['kind']): SheetSource {
  return {
    id,
    kind,
    name: id,
    url: null,
    parentId: null,
    choiceKey: null,
    classId: null,
    level: null,
    characterLevel: null,
    mechanics: null,
    activeEffects: [],
    disabledEffects: [],
    choiceAnswers: {},
  };
}

/**
 * Класс листа для предела.
 * @param patch - правки
 */
function makeClass(
  patch: Partial<PreparedClassInput> = {},
): PreparedClassInput {
  return {
    classId: 'class',
    url: '/classes/wizard',
    level: 5,
    knownSpells: null,
    knownCantrips: 4,
    abilityModifier: 3,
    ...patch,
  };
}

const FIRE_BOLT: SpellDamageData = {
  rolls: [
    {
      dice: '1d10',
      bonus: 0,
      abilityModifier: false,
      types: ['FAIR'],
      healing: false,
      condition: null,
    },
  ],
  cantripScaling: true,
  upcastDice: null,
};

const FIREBALL: SpellDamageData = {
  rolls: [
    {
      dice: '8d6',
      bonus: 0,
      abilityModifier: false,
      types: ['FAIR'],
      healing: false,
      condition: null,
    },
  ],
  cantripScaling: false,
  upcastDice: '1d6',
};

describe('происхождение заклинаний', () => {
  const sources = [
    makeSource('race', 'race'),
    makeSource('feature', 'classFeature'),
    makeSource('feat', 'feat'),
  ];

  it('без источника — книга, вид и черты — врождённые, умения — класс', () => {
    expect(getSpellOrigin({ sourceId: null }, sources)).toBe('book');
    expect(getSpellOrigin({ sourceId: 'race' }, sources)).toBe('innate');
    expect(getSpellOrigin({ sourceId: 'feat' }, sources)).toBe('innate');
    expect(getSpellOrigin({ sourceId: 'feature' }, sources)).toBe('class');
    expect(getSpellOrigin({ sourceId: 'gone' }, sources)).toBe('book');
  });

  it('врождённые и «всегда подготовленные» места в пределе не занимают', () => {
    expect(takesPreparationSpace({ alwaysPrepared: false }, 'book')).toBe(true);

    expect(takesPreparationSpace({ alwaysPrepared: false }, 'innate')).toBe(
      false,
    );

    expect(takesPreparationSpace({ alwaysPrepared: true }, 'class')).toBe(
      false,
    );

    expect(takesPreparationSpace({ alwaysPrepared: false }, 'class')).toBe(
      true,
    );
  });
});

describe('пределы подготовки', () => {
  it('волшебник: модификатор + уровень, бонус сверху', () => {
    const document = makeDocument({
      preparedBonus: 1,
      spells: [
        makeSpell({ id: 'a', level: 1, isPrepared: true }),
        makeSpell({ id: 'b', level: 2, isPrepared: false }),
        makeSpell({
          id: 'c',
          level: 1,
          isPrepared: true,
          alwaysPrepared: true,
        }),
      ],
    });

    const breakdown = getPreparedBreakdown(document, 'spells', [makeClass()]);

    expect(breakdown.classValue).toBe(8);
    expect(breakdown.value).toBe(9);
    expect(breakdown.count).toBe(1);
    expect(breakdown.isKnown).toBe(false);
    expect(formatPreparedValue(breakdown)).toBe('1 / 9');
  });

  it('бард считает известные заклинания, своё число заменяет таблицу', () => {
    const bard = makeClass({ url: '/classes/bard', knownSpells: 6 });

    const document = makeDocument({
      spells: [
        makeSpell({ id: 'a', level: 1 }),
        makeSpell({ id: 'b', level: 2 }),
      ],
    });

    const known = getPreparedBreakdown(document, 'spells', [bard]);

    expect(known.isKnown).toBe(true);
    expect(known.value).toBe(6);
    expect(known.count).toBe(2);

    const custom = getPreparedBreakdown(
      { ...document, preparedLimitOverride: 3, preparedBonus: -1 },
      'spells',
      [bard],
    );

    expect(custom.value).toBe(2);
    expect(custom.isKnown).toBe(false);
  });

  it('заговоры: колонка «Известные заговоры», выданные не в счёт', () => {
    const document = makeDocument({
      sources: [makeSource('race', 'race')],
      cantripsBonus: 1,
      spells: [
        makeSpell({ id: 'a', level: 0 }),
        makeSpell({ id: 'b', level: 0, sourceId: 'race' }),
      ],
    });

    const breakdown = getPreparedBreakdown(document, 'cantrips', [makeClass()]);

    expect(breakdown.classValue).toBe(4);
    expect(breakdown.value).toBe(5);
    expect(breakdown.count).toBe(1);
  });

  it('без классов-заклинателей предела нет', () => {
    const breakdown = getPreparedBreakdown(makeDocument(), 'cantrips', []);

    expect(breakdown.value).toBeNull();
    expect(formatPreparedValue(breakdown)).toBe('0');
  });
});

describe('урон заклинаний', () => {
  const context = {
    abilityModifier: 3,
    characterLevel: 1,
    spellLevel: 0,
    slotLevel: 0,
  };

  it('заговор растёт на 5, 11 и 17 уровне', () => {
    expect(getCantripMultiplier(4)).toBe(1);
    expect(getCantripMultiplier(5)).toBe(2);
    expect(getCantripMultiplier(17)).toBe(4);

    const [tile] = getSpellDamageTiles(FIRE_BOLT, {
      ...context,
      characterLevel: 11,
    });

    expect(tile?.formula).toBe('3к10');
    expect(tile?.typeLabel).toBe('Огонь');
  });

  it('повышение круга добавляет кости к первому броску', () => {
    const base = getSpellDamageTiles(FIREBALL, {
      ...context,
      spellLevel: 3,
      slotLevel: 3,
    });

    const upcast = getSpellDamageTiles(FIREBALL, {
      ...context,
      spellLevel: 3,
      slotLevel: 5,
    });

    expect(base[0]?.formula).toBe('8к6');
    expect(upcast[0]?.formula).toBe('10к6');
  });

  it('кости другой грани и модификатор пишутся отдельно', () => {
    const damage: SpellDamageData = {
      rolls: [
        {
          dice: '1d8',
          bonus: 0,
          abilityModifier: true,
          types: [],
          healing: true,
          condition: null,
        },
      ],
      cantripScaling: false,
      upcastDice: '1d4',
    };

    const [tile] = getSpellDamageTiles(damage, {
      ...context,
      spellLevel: 1,
      slotLevel: 2,
    });

    expect(tile?.formula).toBe('1к8+1к4+3');
    expect(tile?.isHealing).toBe(true);
  });

  it('бросок без костей и бонуса пропускается, условие сохраняется', () => {
    const damage: SpellDamageData = {
      rolls: [
        {
          dice: null,
          bonus: 0,
          abilityModifier: false,
          types: [],
          healing: false,
          condition: null,
        },
        {
          dice: '1d12',
          bonus: 0,
          abilityModifier: false,
          types: ['NECROTIC'],
          healing: false,
          condition: 'Цель с неполными хитами',
        },
      ],
      cantripScaling: false,
      upcastDice: null,
    };

    const tiles = getSpellDamageTiles(damage, context);

    expect(tiles).toHaveLength(1);
    expect(tiles[0]?.conditionLabel).toBe('Цель с неполными хитами');
  });

  it('без урона плиток нет', () => {
    expect(getSpellDamageTiles(null, context)).toEqual([]);
  });
});

describe('ячейки заклинаний', () => {
  const slotRows = [
    { level: 1, max: 4, used: 4 },
    { level: 2, max: 3, used: 1 },
    { level: 3, max: 2, used: 0 },
  ];

  it('предлагает свободные ячейки не ниже круга и договор', () => {
    const options = getSpellSlotOptions(1, slotRows, { slots: 2, level: 3 }, 1);

    expect(options.map((option) => option.value)).toEqual([
      'slot:2',
      'slot:3',
      'pact',
    ]);

    expect(options[0]?.left).toBe(2);
    expect(getSpellSlotOptions(0, slotRows, null, 0)).toEqual([]);
  });

  it('тратит обычную ячейку или ячейку договора', () => {
    const document = makeDocument();

    expect(
      spendSpellSlot(document, { kind: 'slot', level: 2 }).spellSlotsUsed[1],
    ).toBe(1);

    expect(
      spendSpellSlot(document, { kind: 'pact', level: 3 }).pactSlotsUsed,
    ).toBe(1);
  });
});

describe('отбор списка', () => {
  it('подготовленные и круги', () => {
    const filter = { preparedOnly: true, levels: [1] };

    expect(matchesSpellFilter({ level: 1 }, filter, true)).toBe(true);
    expect(matchesSpellFilter({ level: 1 }, filter, false)).toBe(false);
    expect(matchesSpellFilter({ level: 2 }, filter, true)).toBe(false);

    expect(
      matchesSpellFilter(
        { level: 2 },
        { preparedOnly: false, levels: [] },
        false,
      ),
    ).toBe(true);
  });

  it('круги — из заклинаний и ячеек', () => {
    expect(getSpellListLevels([{ level: 3 }, { level: 0 }], [1, 3])).toEqual([
      0, 1, 3,
    ]);
  });
});

describe('справочник заклинаний', () => {
  const definition: FilterDefinition = {
    sources: [],
    other: [
      {
        name: 'Уровень',
        key: 'level',
        param: 'level',
        hidden: false,
        values: [0, 1, 2, 3].map((level) => ({
          label: String(level),
          key: String(level),
          default: false,
        })),
      },
      {
        name: 'Классы',
        key: 'class',
        param: 'class',
        hidden: false,
        values: [
          { label: 'Волшебник', key: '2', default: false },
          { label: 'Жрец', key: '4', default: false },
        ],
      },
    ],
  };

  it('фильтр открывается на классе и доступных кругах', () => {
    const selection = createSpellCatalogPreset(['волшебник', 'Воин'], 2)(
      definition,
      {},
    );

    expect(selection.class).toEqual(['2']);
    expect(selection.level).toEqual(['0', '1', '2']);
  });

  it('своя копия забирает описание, компоненты и урон', () => {
    const detail: SpellDetail = {
      name: { rus: 'Огненный шар', eng: 'Fireball' },
      level: 3,
      school: 'воплощение',
      components: { v: true, s: true, m: 'шарик гуано' },
      time: '1 действие',
      range: '150 футов',
      duration: 'Мгновенная',
      description: ['Первый абзац.', 'Второй абзац.'],
      damage: FIREBALL,
    };

    const copy = copySpellAsCustom(makeSpell({ level: 3 }), detail, 'copy');

    expect(copy.id).toBe('copy');
    expect(copy.url).toBeNull();
    expect(copy.components).toBe('В, С, М (шарик гуано)');
    expect(copy.description).toBe('Первый абзац.\n\nВторой абзац.');
    expect(copy.damage?.upcastDice).toBe('1d6');
  });

  it('описание HTML превращается в текст', () => {
    expect(getDescriptionText('<p>Текст <b>жирный</b></p>')).toBe(
      'Текст жирный',
    );

    expect(getDescriptionText(null)).toBe('');
  });
});

describe('урон в мастерской', () => {
  it('пустые броски отбрасываются, без бросков урона нет', () => {
    const form = createSpellDamageForm(null);

    expect(getSpellDamagePayload(form)).toBeNull();

    const payload = getSpellDamagePayload({
      rolls: [
        {
          dice: ' 8d6 ',
          bonus: 0,
          abilityModifier: false,
          types: ['FAIR'],
          healing: false,
          condition: '',
        },
        {
          dice: '',
          bonus: 0,
          abilityModifier: false,
          types: [],
          healing: false,
          condition: '',
        },
      ],
      cantripScaling: false,
      upcastDice: '1d6',
    });

    expect(payload?.rolls).toHaveLength(1);
    expect(payload?.rolls[0]?.dice).toBe('8d6');
    expect(payload?.rolls[0]?.condition).toBeNull();
    expect(payload?.upcastDice).toBe('1d6');
  });

  it('форма заполняется из справочника', () => {
    const form = createSpellDamageForm(FIREBALL);

    expect(form.rolls[0]?.dice).toBe('8d6');
    expect(form.upcastDice).toBe('1d6');
  });
});
