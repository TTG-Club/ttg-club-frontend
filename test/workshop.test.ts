import { describe, expect, it } from 'vitest';

import {
  archetypeFormSchema,
  classFormSchema,
  createArchetypeForm,
  createArmorForm,
  createBackgroundForm,
  createClassForm,
  createClassTableColumn,
  createFeatForm,
  createGodForm,
  createItemForm,
  createMagicItemForm,
  createOptionForm,
  createRaceForm,
  createSpellForm,
  createWeaponForm,
  describeHtmlProblem,
  extractFormula,
  findFreePersonalizationType,
  getArchetypeEditRoute,
  getArchetypePayload,
  getArmorPayload,
  getBackgroundPayload,
  getBackgroundSkills,
  getClassPayload,
  getFeatPayload,
  getGodPayload,
  getHtmlValidityMessage,
  getItemPayload,
  getMagicItemPayload,
  getOptionPayload,
  getRacePayload,
  getRequirementText,
  getSpellPayload,
  getSpellSchoolValue,
  getWeaponPayload,
  getWorkshopEditRoute,
  getWorkshopSlug,
  parseBookSources,
  parseFilterGroups,
  parseRaceParentOptions,
  parseRevisions,
  parseSavedEntry,
  parseSpellTime,
  parseWorkshopArchetype,
  parseWorkshopArmor,
  parseWorkshopBackground,
  parseWorkshopClass,
  parseWorkshopFeat,
  parseWorkshopGod,
  parseWorkshopItem,
  parseWorkshopMagicItem,
  parseWorkshopOption,
  parseWorkshopRace,
  parseWorkshopRule,
  parseWorkshopSpell,
  parseWorkshopWeapon,
  splitList,
  weaponFormSchema,
} from '~workshop/model';

const SPELL = {
  id: 7,
  name: { rus: 'Огненный снаряд', eng: 'Fire Bolt' },
  level: 0,
  school: 'воплощение',
  components: { v: true, s: true, m: 'щепотка серы' },
  time: '1 действие',
  range: '120 футов',
  duration: 'Мгновенная',
  description: '<p>Урон <dice-roller formula="1к10"/>.</p>',
  source: { shortName: 'PHB', name: 'Книга игрока' },
};

describe('мастерская', () => {
  it('строит адрес правки из английского названия', () => {
    expect(getWorkshopSlug(' Fire  Bolt ')).toBe('Fire_Bolt');
    expect(getWorkshopSlug('Eldritch Blast', true)).toBe('eldritch_blast');

    expect(getWorkshopEditRoute('spells', 'Fire_Bolt')).toBe(
      '/workshop/spells/Fire_Bolt/edit',
    );
  });

  it('отбрасывает битые ревизии поштучно', () => {
    expect(
      parseRevisions([
        {
          revision: 3,
          operation: 'UPDATE',
          username: 'magistrus',
          createdAt: '2026-10-20T10:00:00Z',
        },
        { revision: 2, operation: 'MERGE' },
      ]),
    ).toEqual([
      {
        revision: 3,
        operation: 'UPDATE',
        username: 'magistrus',
        createdAt: '2026-10-20T10:00:00Z',
      },
    ]);
  });

  it('подписывает книги аббревиатурой', () => {
    expect(
      parseBookSources([
        { name: { rus: 'Бестиарий' }, source: { shortName: 'MM' } },
        { name: { rus: 'Без источника' } },
      ]),
    ).toEqual([{ label: 'Бестиарий [MM]', value: 'MM' }]);
  });
});

describe('время накладывания заклинания', () => {
  it.each([
    ['1 действие', { number: 1, unit: 'ACTION', condition: '' }],
    ['1 бонусное действие', { number: 1, unit: 'BONUS', condition: '' }],
    ['10 минут', { number: 10, unit: 'MINUTE', condition: '' }],
    ['8 часов', { number: 8, unit: 'HOUR', condition: '' }],
    ['24 часа', { number: 24, unit: 'HOUR', condition: '' }],
    ['при попадании', { number: 1, unit: 'ON_HIT', condition: '' }],
    [
      '1 реакция, которую вы совершаете, когда падаете ',
      {
        number: 1,
        unit: 'REACTION',
        condition: 'которую вы совершаете, когда падаете',
      },
    ],
    ['1 действие или 8 часов', { number: 1, unit: 'ACTION', condition: '' }],
    [
      '1 реакция, когда вы или союзник падаете',
      {
        number: 1,
        unit: 'REACTION',
        condition: 'когда вы или союзник падаете',
      },
    ],
  ])('разбирает «%s»', (time, expected) => {
    expect(parseSpellTime(time)).toEqual(expected);
  });

  it('незнакомое время даёт время нового заклинания', () => {
    expect(parseSpellTime('мгновенно')).toEqual({
      number: 1,
      unit: 'ACTION',
      condition: '',
    });
  });
});

describe('форма заклинания', () => {
  it('заполняется записью справочника', () => {
    const form = createSpellForm(parseWorkshopSpell(SPELL));

    expect(form).toMatchObject({
      name: 'Огненный снаряд',
      englishName: 'Fire Bolt',
      school: 'EVOCATION',
      verbalComponent: true,
      somaticComponent: true,
      materialComponent: 'щепотка серы',
      timeNumber: 1,
      timeUnit: 'ACTION',
      range: '120 футов',
    });
  });

  it('новое заклинание — воплощение, действие', () => {
    expect(createSpellForm()).toMatchObject({
      school: 'EVOCATION',
      timeNumber: 1,
      timeUnit: 'ACTION',
      level: 0,
    });

    expect(getSpellSchoolValue('неизвестная')).toBe('EVOCATION');
  });

  it('не отправляет пустые необязательные поля', () => {
    const payload = getSpellPayload(createSpellForm(), '');

    expect(payload.source).toBeUndefined();
    expect(payload.upper).toBeUndefined();
    expect(payload.materialComponent).toBeUndefined();
    expect(getSpellPayload(createSpellForm(), 'PHB').source).toBe('PHB');
  });
});

describe('hTML-редактор', () => {
  it('достаёт формулу из выделения', () => {
    expect(extractFormula('урон 2к6 + 1 огнём')).toBe('2к6 + 1');
    expect(extractFormula('без формулы')).toBe('');
  });

  it('описывает ошибку разметки', () => {
    const problem = {
      message: 'Ссылка внутри ссылки',
      start: 0,
      end: 3,
      context: 'Огненный шар',
    };

    expect(describeHtmlProblem(problem)).toBe(
      'Ссылка внутри ссылки — рядом с «Огненный шар»',
    );

    expect(getHtmlValidityMessage([problem])).toContain('ссылка внутри ссылки');

    expect(getHtmlValidityMessage([])).toBe('');
  });
});

describe('общее мастерской', () => {
  it('понимает ответ сохранения справочника и богов', () => {
    expect(parseSavedEntry({ name: { rus: 'А', eng: 'Alert' } })).toEqual({
      englishName: 'Alert',
    });

    expect(parseSavedEntry({ englishName: 'Tyr' })).toEqual({
      englishName: 'Tyr',
    });
  });

  it('берёт списки из групп фильтров', () => {
    const groups = parseFilterGroups({
      other: [
        { key: 'pantheon', values: [{ key: 3, label: 'Фаэрун' }] },
        { key: 'rank', values: [{ key: 'GREATER', label: 'Высший' }] },
      ],
    });

    expect(groups.get('pantheon')).toEqual([{ label: 'Фаэрун', value: '3' }]);
    expect(groups.get('rank')).toEqual([{ label: 'Высший', value: 'GREATER' }]);
    expect(parseFilterGroups(null).size).toBe(0);
  });

  it('разбирает требования и списки', () => {
    expect(getRequirementText('Нет')).toBe('');
    expect(getRequirementText(' Сила 13 ')).toBe('Сила 13');
    expect(splitList(' Общий, , Эльфийский ')).toEqual(['Общий', 'Эльфийский']);
  });
});

describe('редактор черт', () => {
  const FEAT = {
    id: 3,
    name: { rus: 'Бдительный', eng: 'Alert' },
    requirements: 'Нет',
    abilities: ['DEXTERITY'],
    skills: [],
    description: '<p>Текст</p>',
    source: { shortName: 'PHB' },
  };

  it('заполняется записью справочника', () => {
    const feat = parseWorkshopFeat(FEAT);

    expect(createFeatForm(feat)).toMatchObject({
      name: 'Бдительный',
      englishName: 'Alert',
      requirement: '',
      level: null,
      abilities: ['DEXTERITY'],
    });

    expect(feat.source).toBe('PHB');
  });

  it('не отправляет пустые необязательные поля', () => {
    const payload = getFeatPayload(createFeatForm(), undefined);

    expect(payload.altName).toBeUndefined();
    expect(payload.level).toBeUndefined();
    expect(payload.requirement).toBeUndefined();
  });
});

describe('редактор особенностей', () => {
  it('заполняется записью и отправляет типы', () => {
    const option = parseWorkshopOption({
      id: 5,
      name: { rus: 'Мучительный взрыв', eng: 'Agonizing Blast' },
      prerequisite: 'Заговор мистический заряд',
      level: null,
      optionTypes: ['ELDRITCH_INVOCATION'],
      description: '<p>Текст</p>',
    });

    const form = createOptionForm(option);

    expect(form.optionTypes).toEqual(['ELDRITCH_INVOCATION']);

    expect(getOptionPayload(form, 'PHB')).toMatchObject({
      prerequisite: 'Заговор мистический заряд',
      level: undefined,
      source: 'PHB',
    });
  });
});

describe('редактор правил', () => {
  it('берёт страницу из источника', () => {
    const rule = parseWorkshopRule({
      id: 1,
      name: { rus: 'Укрытие', eng: 'Cover' },
      type: 'Бой',
      description: '<p>Текст</p>',
      source: { shortName: 'PHB', page: 196 },
    });

    expect(rule).toMatchObject({ page: 196, source: 'PHB', type: 'Бой' });
  });
});

describe('редактор богов', () => {
  it('отправляет пантеон числом', () => {
    const god = parseWorkshopGod({
      id: 9,
      name: 'Тир',
      englishName: 'Tyr',
      sex: 'MALE',
      rank: 'GREATER',
      alignment: 'LAWFUL_GOOD',
      domains: ['WAR'],
      pantheonId: 3,
      source: 'PHB',
    });

    const payload = getGodPayload(createGodForm(god), god.source);

    expect(payload).toMatchObject({
      pantheonId: 3,
      domains: ['WAR'],
      source: 'PHB',
      description: undefined,
    });
  });
});

describe('редактор предысторий', () => {
  const BACKGROUND = {
    id: 2,
    name: { rus: 'Отшельник', eng: 'Hermit' },
    skills: ['Медицина', 'Религия', 'Один навык на выбор'],
    equipments: ['Футляр для свитков', 'зимнее одеяло'],
    startGold: 5,
    languages: ['Общий'],
    description: '<p>Текст</p>',
    personalizationTables: [
      {
        type: 'TRAIT',
        tbody: [
          ['1', 'Спокойный'],
          ['2', 'Говорливый'],
        ],
      },
    ],
  };

  it('разбирает навыки из названий', () => {
    expect(getBackgroundSkills(['Медицина', 'ловкость рук', 'Любой'])).toEqual({
      values: ['MEDICINE', 'SLEIGHT_OF_HAND'],
      other: 'Любой',
    });
  });

  it('заполняется записью справочника', () => {
    const form = createBackgroundForm(parseWorkshopBackground(BACKGROUND));

    expect(form).toMatchObject({
      skills: ['MEDICINE', 'RELIGION'],
      otherSkills: 'Один навык на выбор',
      equipments: 'Футляр для свитков, зимнее одеяло',
      languages: 'Общий',
      lifeStyle: undefined,
      personalizationTables: [
        { type: 'TRAIT', values: ['Спокойный', 'Говорливый'] },
      ],
    });
  });

  it('отправляет языки списком и обрезает строки таблиц', () => {
    const form = createBackgroundForm(parseWorkshopBackground(BACKGROUND));

    form.languages = 'Общий, Дварфийский';
    form.personalizationTables = [{ type: 'IDEAL', values: [' Честь '] }];

    expect(getBackgroundPayload(form, undefined)).toMatchObject({
      languages: ['Общий', 'Дварфийский'],
      lifeStyle: undefined,
      personalizationTables: [{ type: 'IDEAL', values: ['Честь'] }],
    });
  });

  it('предлагает первую свободную таблицу', () => {
    expect(findFreePersonalizationType([])).toBe('LIFE_IN_SECLUSION');

    expect(
      findFreePersonalizationType([{ type: 'LIFE_IN_SECLUSION', values: [] }]),
    ).toBe('EMPLOYMENT');
  });
});

describe('редактор оружия', () => {
  const WEAPON = {
    id: 4,
    name: { rus: 'Длинный лук', eng: 'Longbow' },
    typeRaw: 'WAR_RANGED',
    damageType: 'PIERCING',
    numberDice: 1,
    damageDice: 'd8',
    cost: 50,
    currency: 'GM',
    weight: 2,
    minDistance: 150,
    maxDistance: 600,
    propertyIds: [1, 3, 6],
    source: { shortName: 'PHB' },
  };

  it('заполняется записью и отправляет свойства числами', () => {
    const form = createWeaponForm(parseWorkshopWeapon(WEAPON));

    expect(form).toMatchObject({
      type: 'WAR_RANGED',
      damageDice: 'd8',
      twoHandDamageDice: undefined,
      properties: ['1', '3', '6'],
    });

    expect(getWeaponPayload(form, 'PHB')).toMatchObject({
      properties: [1, 3, 6],
      cost: 50,
      ammo: undefined,
      special: undefined,
    });
  });

  it('новое оружие — простое рукопашное, 1к6 дробящего', () => {
    expect(createWeaponForm()).toMatchObject({
      type: 'SIMPLE_MELE',
      damageType: 'BLUDGEONING',
      numberDice: 1,
      damageDice: 'd6',
      currency: 'GM',
    });
  });

  it('не принимает дальнюю дистанцию меньше ближней', () => {
    const form = createWeaponForm(parseWorkshopWeapon(WEAPON));

    form.maxDistance = 100;

    expect(weaponFormSchema.safeParse(form).success).toBe(false);
  });
});

describe('редактор доспехов', () => {
  it('сохраняет нулевую цену и помеху', () => {
    const armor = parseWorkshopArmor({
      id: 6,
      name: { rus: 'Щит', eng: 'Shield' },
      typeRaw: 'SHIELD',
      armorClassRaw: 2,
      cost: 0,
      weight: 6,
      disadvantage: true,
    });

    expect(getArmorPayload(createArmorForm(armor), undefined)).toMatchObject({
      type: 'SHIELD',
      armorClass: 2,
      cost: 0,
      stealthHindrance: true,
      forceRequirements: undefined,
    });

    expect(createArmorForm()).toMatchObject({ type: 'LIGHT', armorClass: 10 });
  });
});

describe('редактор снаряжения', () => {
  it('берёт коды категорий', () => {
    const item = parseWorkshopItem({
      id: 8,
      name: { rus: 'Верёвка', eng: 'Rope' },
      categoriesRaw: ['ADVENTURING_GEAR'],
      cost: 1,
      currency: 'GM',
      weight: 10,
    });

    expect(getItemPayload(createItemForm(item), undefined)).toMatchObject({
      categories: ['ADVENTURING_GEAR'],
      currency: 'GM',
      altName: undefined,
    });
  });
});

describe('редактор магических предметов', () => {
  it('заполняется записью справочника', () => {
    const item = parseWorkshopMagicItem({
      id: 10,
      name: { rus: 'Плащ защиты', eng: 'Cloak of Protection' },
      rarityRaw: 'UNCOMMON',
      typeRaw: 'SUBJECT',
      customization: true,
      costRaw: 3500,
      description: '<p>Текст</p>',
    });

    expect(
      getMagicItemPayload(createMagicItemForm(item), undefined),
    ).toMatchObject({
      rarity: 'UNCOMMON',
      customization: true,
      cost: 3500,
      curse: false,
      special: undefined,
    });
  });
});

describe('редактор рас', () => {
  const race = parseWorkshopRace({
    id: 4,
    name: { rus: 'Высший эльф', eng: 'High' },
    parentId: 3,
    sizeRaw: 'MEDIUM',
    typeRaw: 'HUMANOID',
    speed: [{ value: 30 }, { name: 'летая', value: 0 }],
    fly: 0,
    darkvision: 60,
    view: true,
    abilities: [{ key: 'INTELLIGENCE', name: 'Интеллект', value: 1 }],
    features: [
      {
        id: 12,
        name: 'Заговор',
        englishName: null,
        description: '<p>Текст</p>',
        feature: false,
        replaceFeatureId: null,
      },
    ],
    description: '<p>Описание</p>',
    source: { shortName: 'PHB' },
  });

  it('заполняется записью справочника', () => {
    expect(race).toMatchObject({
      parentId: '3',
      speed: 30,
      abilities: [{ ability: 'INTELLIGENCE', bonus: 1 }],
      source: 'PHB',
    });
  });

  it('не отправляет нулевую скорость полёта и шлёт родителя числом', () => {
    expect(getRacePayload(createRaceForm(race), 'PHB')).toMatchObject({
      parentId: 3,
      fly: undefined,
      darkvision: 60,
      origin: undefined,
      features: [
        { id: 12, englishName: undefined, replaceFeatureId: undefined },
      ],
    });
  });

  it('новая раса — средний гуманоид со скоростью 30', () => {
    expect(createRaceForm()).toMatchObject({
      size: 'MEDIUM',
      type: 'HUMANOID',
      speed: 30,
      view: true,
    });
  });

  it('не предлагает расу родительской для самой себя', () => {
    const options = parseRaceParentOptions(
      [
        { id: 3, name: { rus: 'Эльф', eng: 'Elf' } },
        { id: 4, name: { rus: 'Высший эльф', eng: 'High' } },
      ],
      4,
    );

    expect(options).toEqual([{ label: 'Эльф (Elf)', value: '3' }]);
  });
});

describe('редактор классов', () => {
  const heroClass = parseWorkshopClass({
    id: 2,
    name: { rus: 'Воин', eng: 'Fighter' },
    primaryAbilities: ['STRENGTH'],
    availableSkillsRaw: ['ATHLETICS'],
    spellcasterType: 'NONE',
    optionType: 'FIGHTING_STYLE',
    enabledArhitypeLevel: 3,
    sidekick: false,
    classTraits: [
      {
        id: 7,
        name: 'Второе дыхание',
        level: 1,
        description: '<p>Текст</p>',
        optional: false,
      },
    ],
    tableColumns: [{ id: 5, name: 'Атаки', levels: [1, 1, null] }],
    traits: { diceHp: 10, skillAvailableCount: 2, armor: '<p>Все</p>' },
    source: { shortName: 'PHB' },
  });

  it('берёт кость хитов и навыки из блока traits', () => {
    expect(heroClass).toMatchObject({
      diceHp: 10,
      skillAvailableCount: 2,
      armor: '<p>Все</p>',
      optionType: 'FIGHTING_STYLE',
    });
  });

  it('дополняет колонки таблицы до двадцати уровней', () => {
    expect(heroClass.tableColumns[0]?.levels).toHaveLength(20);
  });

  it('отправляет пустые ячейки нулями', () => {
    const payload = getClassPayload(createClassForm(heroClass), undefined);

    expect(payload).toMatchObject({
      spellAbility: undefined,
      weapon: undefined,
      classTraits: [{ id: 7, suffix: undefined, child: undefined }],
    });

    expect(payload.tableColumns).toEqual([
      expect.objectContaining({
        levels: [1, 1, ...Array.from({ length: 18 }, () => 0)],
      }),
    ]);
  });

  it('не принимает значение ячейки больше 127', () => {
    const column = { ...createClassTableColumn(), name: 'Ки' };

    column.levels[0] = 128;

    const form = {
      ...createClassForm(heroClass),
      tableColumns: [column],
    };

    expect(classFormSchema.safeParse(form).success).toBe(false);
  });
});

describe('редактор архетипов', () => {
  const archetype = parseWorkshopArchetype({
    id: 9,
    name: 'Чемпион',
    englishName: 'Champion',
    description: '<p>Описание</p>',
    level: 3,
    spellcasterType: null,
    optionType: 'MANEUVER',
    spellLevelType: null,
    traits: [
      {
        id: 1,
        name: 'Крит',
        level: 3,
        description: '<p>Т</p>',
        optional: false,
      },
    ],
    tableColumns: [],
  });

  it('сохраняет особенности архетипа, которые форма не правит', () => {
    const form = createArchetypeForm(archetype);

    expect(archetypeFormSchema.safeParse(form).success).toBe(true);

    expect(getArchetypePayload(form, archetype)).toMatchObject({
      optionType: 'MANEUVER',
      spellcasterType: undefined,
      spellLevelType: 'CLASS_LEVEL',
    });
  });

  it('строит адрес правки архетипа', () => {
    expect(getArchetypeEditRoute('fighter', 'champion')).toBe(
      '/workshop/classes/fighter/champion/edit',
    );
  });
});
