import type { ClassTraits } from '~character/model';

import { describe, expect, it } from 'vitest';

import {
  backgroundDetailSchema,
  classDetailSchema,
  expandClassSearch,
  findClassArchetype,
  findClassFeature,
  getArchetypeSpellLevelHeader,
  getArchetypeSpellSuffix,
  getBackgroundLanguages,
  getClassDescription,
  getClassHitPoints,
  getClassIcon,
  getClassOptionsLink,
  getClassOptionTabs,
  getClassSkillsLabel,
  getClassSpellsFilterUrl,
  getClassSpellsLink,
  getParentClassName,
  getRaceAbilitiesLabel,
  getRaceEditPath,
  getRaceSpeedLabel,
  getRaceStats,
  getRequirementsLabel,
  getSpellComponentLabels,
  getSpellGroup,
  getSpellTypeLabel,
  groupByBookType,
  hasPersonalization,
  raceDetailSchema,
  raceLinkSchema,
  sortByGroup,
  sortClassFeatures,
  spellDetailSchema,
} from '~character/model';
import { normalizeFilter } from '~section/model';

const name = { rus: 'Артист', eng: 'Entertainer' };

describe('требования', () => {
  it('подписывает требования черты', () => {
    expect(getRequirementsLabel('Сила 13 или выше')).toBe(
      'Требования: Сила 13 или выше',
    );
  });

  it('без требований пишет «Нет», как в старом SPA', () => {
    expect(getRequirementsLabel(null)).toBe('Требования: Нет');
    expect(getRequirementsLabel('')).toBe('Требования: Нет');
  });
});

describe('предыстории', () => {
  it('берёт языки списком, если он есть', () => {
    const background = backgroundDetailSchema.parse({
      name,
      languages: ['Эльфийский', 'Дварфийский'],
      language: 'Один на выбор',
    });

    expect(getBackgroundLanguages(background)).toBe('Эльфийский, Дварфийский');
  });

  it('у старых записей берёт языки одной строкой', () => {
    const background = backgroundDetailSchema.parse({
      name,
      languages: [],
      language: 'Один на выбор',
    });

    expect(getBackgroundLanguages(background)).toBe('Один на выбор');
  });

  it('показывает персонализацию, если есть текст или таблицы', () => {
    expect(hasPersonalization(backgroundDetailSchema.parse({ name }))).toBe(
      false,
    );

    expect(
      hasPersonalization(
        backgroundDetailSchema.parse({
          name,
          personalizationTables: [
            {
              name: 'Черта характера',
              formula: '1к4',
              thead: ['Черта характера'],
              tbody: [['1', 'Я весел.']],
            },
          ],
        }),
      ),
    ).toBe(true);
  });
});

describe('заклинания', () => {
  const spell = spellDetailSchema.parse({
    name: { rus: 'Огненный шар', eng: 'Fireball' },
    level: 3,
    school: 'воплощение',
    components: { v: true, s: true, m: 'крошечный шарик из гуано' },
  });

  it('группирует заговоры отдельно от кругов', () => {
    expect(getSpellGroup({ level: 0 })).toBe('Заговоры');
    expect(getSpellGroup({ level: 3 })).toBe('3 уровень');
  });

  it('подписывает круг, школу, доп. тип и ритуал', () => {
    expect(getSpellTypeLabel(spell)).toBe('3 уровень, воплощение');

    expect(
      getSpellTypeLabel({
        ...spell,
        level: 0,
        additionalType: 'огонь',
        ritual: true,
      }),
    ).toBe('заговор, воплощение [огонь] (ритуал)');
  });

  it('показывает только компоненты заклинания, материальный — с описанием', () => {
    expect(
      getSpellComponentLabels(spell.components).map(({ label }) => label),
    ).toEqual([
      'Вербальный',
      'Соматический',
      'Материальный (крошечный шарик из гуано)',
    ]);

    expect(
      getSpellComponentLabels({ v: true, m: true }).map(({ label }) => label),
    ).toEqual(['Вербальный', 'Материальный']);
  });
});

describe('расы', () => {
  const source = { shortName: 'PHB', name: 'Книга игрока' };
  const type = { name: 'Официальные источники', order: 0 };

  const race = (rus: string, group?: { name: string; order: number }) =>
    raceLinkSchema.parse({
      name: { rus, eng: rus },
      url: `/races/${rus}`,
      type,
      source,
      group,
    });

  it('пишет бонусы характеристик, а бонус ко всем — одной фразой', () => {
    const abilities = ['СИЛ', 'ЛОВ', 'ТЕЛ', 'ИНТ', 'МДР', 'ХАР'].map(
      (shortName) => ({ name: shortName, shortName, value: 1 }),
    );

    expect(
      getRaceAbilitiesLabel([
        { name: 'Ловкость', shortName: 'ЛОВ', value: 2 },
        { name: 'Две на выбор', value: null },
      ]),
    ).toBe('ЛОВ +2, Две на выбор');

    expect(getRaceAbilitiesLabel(abilities, true)).toBe('+1 к каждой');
    expect(getRaceAbilitiesLabel(abilities)).toContain('ХАР +1');
  });

  it('пишет скорости с видом передвижения', () => {
    expect(
      getRaceSpeedLabel([{ value: 30 }, { name: 'летая', value: 50 }]),
    ).toBe('30 фт., летая 50 фт.');
  });

  it('ставит основные расы первыми, группы — по порядку', () => {
    const sorted = sortByGroup([
      race('Аасимар', { name: 'Монстры', order: 1 }),
      race('Эльф'),
      race('Кастом', { name: 'Происхождения', order: 0 }),
      race('Дварф'),
    ]);

    expect(sorted.map((item) => item.name.rus)).toEqual([
      'Дварф',
      'Эльф',
      'Кастом',
      'Аасимар',
    ]);
  });

  it('делит разновидности по типу книги в его порядке', () => {
    const groups = groupByBookType([
      { ...race('Морской'), type: { name: 'UA', order: 2 } },
      race('Высший'),
      race('Лесной'),
    ]);

    expect(groups.map((group) => [group.name, group.items.length])).toEqual([
      ['Официальные источники', 2],
      ['UA', 1],
    ]);
  });

  it('показывает слева только заполненные свойства расы', () => {
    const stats = getRaceStats({
      name: { rus: 'Эльф', eng: 'Elf' },
      type: 'Гуманоид',
      size: 'Средний',
      speed: [{ value: 30 }],
      darkvision: 60,
    });

    expect(stats.map(({ label, value }) => [label, value])).toEqual([
      ['Тип', 'Гуманоид'],
      ['Размер', 'Средний'],
      ['Скорость', '30 фт.'],
      ['Тёмное зрение', '60 фт.'],
    ]);
  });

  it('берёт основную расу и её разновидности для выбора', () => {
    const detail = raceDetailSchema.parse({
      name: { rus: 'Высший эльф', eng: 'High elf' },
      baseRace: {
        ...race('Эльф'),
        subraces: [
          { ...race('Высший эльф'), url: '/races/elf/high_elf' },
          { ...race('Лесной эльф'), url: '/races/elf/wood_elf' },
        ],
      },
    });

    expect(detail.baseRace?.subraces?.map((link) => link.url)).toEqual([
      '/races/elf/high_elf',
      '/races/elf/wood_elf',
    ]);
  });

  it('правка разновидности ведёт в мастерскую рас', () => {
    expect(getRaceEditPath('/races/elf/high')).toBe(
      '/workshop/races/high/edit',
    );
  });
});

describe('классы', () => {
  const feature = (id: string, level: number, isRoot = false) => ({
    id,
    name: id,
    level,
    archetypeFeature: isRoot,
    archetypeRoot: isRoot,
  });

  const traits: ClassTraits = {
    diceHp: 6,
    skillAvailableCount: 2,
    availableSkills: ['Анализ', 'История'],
    features: [feature('c3', 4), feature('a1', 2), feature('c1', 1)],
    archetype: feature('ad1', 2, true),
  };

  const wizard = classDetailSchema.parse({
    name: { rus: 'Волшебник', eng: 'Wizard' },
    url: '/classes/wizard',
    source: { shortName: 'PHB', name: 'Книга игрока' },
    tabs: [
      {
        name: 'Заклинания',
        url: '/filters/spells/wizard',
        type: 'spells',
        order: 2,
      },
      {
        name: 'Навыки',
        url: '/classes/fragment/wizard',
        type: 'traits',
        order: 0,
      },
      {
        name: 'Особенности',
        url: '/filters/options/wizard',
        type: 'options',
        order: 3,
      },
    ],
    traits,
  });

  it('берёт значок только у классов, для которых он есть', () => {
    expect(getClassIcon('class/wizard')).toBe('ttg:class-wizard');
    expect(getClassIcon('class/unknown')).toBeUndefined();
    expect(getClassIcon(null)).toBeUndefined();
  });

  it('берёт из вкладок только особенности с ручкой их фильтра', () => {
    expect(getClassOptionTabs(wizard)).toEqual([
      {
        key: 'options-3',
        name: 'Особенности',
        filterUrl: '/api/v1/filters/options/wizard',
      },
    ]);
  });

  it('особенности класса открываются в разделе с фильтром класса', () => {
    const filter = normalizeFilter({
      other: [
        {
          name: 'Классовые особенности',
          key: 'classOption',
          hidden: true,
          values: [{ label: 'Колдун', key: 'INVOCATION', default: true }],
        },
      ],
    });

    expect(getClassOptionsLink(filter)).toEqual({
      path: '/options',
      query: { classOption: 'INVOCATION' },
    });

    expect(getClassOptionsLink(normalizeFilter([]))).toBeUndefined();
  });

  it('заклинания класса открываются в разделе с фильтром класса', () => {
    expect(getClassSpellsFilterUrl(wizard)).toBe(
      '/api/v1/filters/spells/wizard',
    );

    const filter = normalizeFilter({
      other: [
        { name: 'Уровень', key: 'level', values: [{ label: '1', key: '1' }] },
        {
          name: 'Классы',
          key: 'class',
          hidden: true,
          values: [{ label: 'Волшебник', key: '2', default: true }],
        },
      ],
    });

    expect(getClassSpellsLink(filter)).toEqual({
      path: '/spells',
      query: { class: '2' },
    });

    expect(getClassSpellsLink(normalizeFilter([]))).toBeUndefined();
  });

  it('узнаёт открытый архетип и название его класса', () => {
    const archetype = {
      name: { rus: 'Школа воплощения', eng: 'School of Evocation' },
      url: '/classes/wizard/evocation',
      type: { name: 'Официальные', order: 0 },
    };

    const evocation = classDetailSchema.parse({
      ...wizard,
      name: {
        rus: 'Волшебник Школа воплощения',
        eng: 'Wizard School of Evocation',
      },
      archetypes: [archetype],
    });

    expect(findClassArchetype(evocation, evocation.url)).toBeUndefined();

    expect(findClassArchetype(evocation, archetype.url)?.url).toBe(
      archetype.url,
    );

    expect(getParentClassName(evocation, archetype)).toBe('Волшебник');
    expect(getParentClassName(wizard)).toBe('Волшебник');
  });

  it('считает хиты как в старом SPA', () => {
    expect(getClassHitPoints(10)).toEqual({ formula: '1к10', average: 6 });
  });

  it('подписывает выбор навыков', () => {
    expect(getClassSkillsLabel(traits)).toBe(
      'Выберите 2 навыка из следующих: Анализ, История',
    );

    expect(getClassSkillsLabel({ ...traits, skillAvailableCount: 18 })).toBe(
      'Выберите любые навыки.',
    );
  });

  it('ставит архетип первым на его уровне', () => {
    expect(sortClassFeatures(traits).map((item) => item.id)).toEqual([
      'c1',
      'ad1',
      'a1',
      'c3',
    ]);
  });

  it('находит умение по якорю из таблицы', () => {
    expect(findClassFeature(traits, '#a1')?.id).toBe('a1');
    expect(findClassFeature(traits, '#c9')).toBeUndefined();
  });

  it('у архетипа описание берётся из его умения', () => {
    expect(
      getClassDescription({
        ...wizard,
        traits: {
          ...traits,
          archetype: {
            ...feature('ad1', 2, true),
            description: '<p>Школа</p>',
          },
        },
      }),
    ).toBe('<p>Школа</p>');
  });

  it('подписывает колонку уровня в таблице заклинаний архетипа', () => {
    expect(
      getArchetypeSpellLevelHeader({
        levelType: 'CLASS_LEVEL',
        classNameGenitive: 'волшебника',
        levels: [],
      }),
    ).toBe('Уровень волшебника');

    expect(
      getArchetypeSpellLevelHeader({ levelType: 'SPELL_LEVEL', levels: [] }),
    ).toBe('Уровень заклинания');
  });

  it('добавляет условие и запятую к заклинанию архетипа', () => {
    const spell = {
      name: 'Молния',
      englishName: 'Lightning bolt',
      url: '/spells/x',
    };

    expect(
      getArchetypeSpellSuffix({ ...spell, advanced: 'в бою' }, false),
    ).toBe(' (в бою),');

    expect(getArchetypeSpellSuffix(spell, true)).toBe('');
  });
});

describe('поиск классов', () => {
  const source = { shortName: 'PHB', name: 'Книга игрока' };
  const type = { name: 'Официальные', order: 0 };

  const wizard = {
    name: { rus: 'Волшебник', eng: 'Wizard' },
    url: '/classes/wizard',
    source,
    image: '/wizard.webp',
    icon: 'class/wizard',
    archetypes: [
      {
        name: { rus: 'Школа воплощения', eng: 'School of Evocation' },
        url: '/classes/wizard/evocation',
        type,
        source,
      },
    ],
  };

  it('без поиска оставляет классы как есть', () => {
    expect(expandClassSearch([wizard], ' ')).toEqual([wizard]);
  });

  it('класс, найденный по названию, остаётся карточкой', () => {
    expect(expandClassSearch([wizard], 'волш')).toEqual([wizard]);
    expect(expandClassSearch([wizard], 'WIZ')).toEqual([wizard]);
  });

  it('найденные подклассы встают карточками с обложкой класса', () => {
    expect(expandClassSearch([wizard], 'воплощ')).toEqual([
      {
        ...wizard,
        name: { rus: 'Школа воплощения', eng: 'School of Evocation' },
        url: '/classes/wizard/evocation',
        archetypes: [],
      },
    ]);
  });
});
