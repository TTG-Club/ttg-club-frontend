import type { ClassStartingEquipmentLine } from '~character/model';

import { describe, expect, it } from 'vitest';

import {
  getChosenCoins,
  getClassStartingEquipment,
  getEquipmentChoiceKey,
  getEquipmentChoiceRequest,
  resolveChosenEquipment,
  toEquipmentChoiceOptions,
  toWizardStartingEquipment,
} from '~character-sheet/model';
import {
  classDetailSchema,
  formatStartingEquipmentLine,
  getStartingEquipmentMarkup,
  getStartingEquipmentSection,
  parseStartingEquipment,
} from '~character/model';
import {
  classFormSchema,
  createClassForm,
  findStartingEquipmentCategory,
  formatStartingEquipmentFormLine,
  getClassPayload,
  getStartingEquipmentPayload,
  moveListEntry,
  parseStartingEquipmentText,
  parseWorkshopClass,
  toStartingEquipmentForm,
} from '~workshop/model';

/** Снаряжение воина из справочника 5e14 как есть. */
const FIGHTER_TEXT = [
  '{@list {@li а) {@link кольчуга [chain mail] | url:/armors/chain_mail} или б) {@link кожаный доспех [leather armor] | url:/armors/leather_armor}, {@link длинный лук [longbow] | url:/weapons/longbow} и 20 {@item стрел [arrows] | url:arrows}}{@li а) воинское оружие и {@link щит [shield] | url:/armors/shield} или б) два воинских оружия}}',
];

/** Снаряжение данными: выбор доспеха, выбор оружия с монетами. */
const STRUCTURED: Array<ClassStartingEquipmentLine> = [
  {
    options: [
      {
        items: [
          {
            kind: 'ITEM',
            section: 'ARMOR',
            url: '/armors/chain_mail',
            name: 'Кольчуга',
            quantity: 1,
            description: null,
            category: null,
          },
        ],
        coins: null,
      },
      {
        items: [
          {
            kind: 'ITEM',
            section: 'ARMOR',
            url: '/armors/leather_armor',
            name: 'Кожаный доспех',
            quantity: 1,
            description: null,
            category: null,
          },
          {
            kind: 'ITEM',
            section: 'WEAPON',
            url: '/weapons/longbow',
            name: 'Длинный лук',
            quantity: 1,
            description: null,
            category: null,
          },
          {
            kind: 'ITEM',
            section: 'ITEM',
            url: '/items/arrows',
            name: 'стрел',
            quantity: 20,
            description: null,
            category: null,
          },
        ],
        coins: null,
      },
    ],
  },
  {
    options: [
      {
        items: [
          {
            kind: 'CHOICE',
            section: null,
            url: null,
            name: '',
            quantity: 1,
            description: null,
            category: 'MARTIAL_WEAPON',
          },
        ],
        coins: 10,
      },
    ],
  },
];

describe('разбор стартового снаряжения данными', () => {
  it('пустое и не массив — не заполнено', () => {
    expect(parseStartingEquipment(null)).toBeNull();
    expect(parseStartingEquipment(undefined)).toBeNull();
    expect(parseStartingEquipment({})).toBeNull();
    expect(parseStartingEquipment([])).toBeNull();
  });

  it('незнакомые значения — null, битое отбрасывается', () => {
    const lines = parseStartingEquipment([
      'мусор',
      { options: [] },
      {
        options: [
          {
            items: [
              {
                kind: 'ITEM',
                section: 'MAGIC',
                url: '/weapons/longbow',
                name: 'Длинный лук',
                quantity: 0,
                category: 'NOPE',
              },
              { kind: 'ITEM', name: '', url: null },
              { kind: 'CHOICE', category: 'BAD', name: 'Что-то своё' },
              42,
            ],
            coins: 'много',
          },
          { items: [], coins: 0 },
        ],
      },
    ]);

    expect(lines).toEqual([
      {
        options: [
          {
            items: [
              {
                kind: 'ITEM',
                section: 'WEAPON',
                url: '/weapons/longbow',
                name: 'Длинный лук',
                quantity: 1,
                description: null,
                category: null,
              },
              {
                kind: 'ITEM',
                section: null,
                url: null,
                name: 'Что-то своё',
                quantity: 1,
                description: null,
                category: null,
              },
            ],
            coins: null,
          },
        ],
      },
    ]);
  });

  it('карточка класса разбирает поле, отсутствие — null', () => {
    const base = {
      name: { rus: 'Воин', eng: 'Fighter' },
      url: '/classes/fighter',
      source: { shortName: 'PHB', name: 'Книга игрока' },
      traits: { diceHp: 10, skillAvailableCount: 2 },
    };

    const withoutEquipment = classDetailSchema.safeParse(base);

    const withEquipment = classDetailSchema.safeParse({
      ...base,
      traits: { ...base.traits, startingEquipment: STRUCTURED },
    });

    expect(withoutEquipment.success).toBe(true);
    expect(withoutEquipment.data?.traits?.startingEquipment).toBeNull();
    expect(withEquipment.data?.traits?.startingEquipment).toEqual(STRUCTURED);
  });

  it('раздел по адресу записи', () => {
    expect(getStartingEquipmentSection('/weapons/longbow')).toBe('WEAPON');
    expect(getStartingEquipmentSection('/armors/shield')).toBe('ARMOR');
    expect(getStartingEquipmentSection('/items/arrows')).toBe('ITEM');
    expect(getStartingEquipmentSection('/spells/fireball')).toBeNull();
    expect(getStartingEquipmentSection(null)).toBeNull();
  });
});

describe('текст стартового снаряжения', () => {
  it('выбор «а) … или б) …», количество перед названием', () => {
    expect(formatStartingEquipmentLine(STRUCTURED[0]!)).toBe(
      'а) кольчуга или б) кожаный доспех, длинный лук и 20 стрел',
    );
  });

  it('выбор из категории и монеты', () => {
    expect(formatStartingEquipmentLine(STRUCTURED[1]!)).toBe(
      'любое воинское оружие + 10 зм',
    );
  });

  it('три варианта, уточнение, несколько из категории, только монеты', () => {
    const line: ClassStartingEquipmentLine = {
      options: [
        {
          items: [
            {
              kind: 'CHOICE',
              section: null,
              url: null,
              name: '',
              quantity: 2,
              description: null,
              category: 'SIMPLE_WEAPON',
            },
          ],
          coins: null,
        },
        {
          items: [
            {
              kind: 'ITEM',
              section: null,
              url: null,
              name: 'Священный символ',
              quantity: 1,
              description: 'подарок',
              category: null,
            },
          ],
          coins: null,
        },
        { items: [], coins: 50 },
      ],
    };

    expect(formatStartingEquipmentLine(line)).toBe(
      'а) 2 любых простых оружия, б) священный символ (подарок) или в) 50 зм',
    );
  });

  it('разметка: список строк, предметы — ссылками', () => {
    expect(getStartingEquipmentMarkup(STRUCTURED)).toEqual([
      '{@list {@li а) {@link кольчуга | url:/armors/chain_mail} или б) '
        + '{@link кожаный доспех | url:/armors/leather_armor}, '
        + '{@link длинный лук | url:/weapons/longbow} и 20 '
        + '{@link стрел | url:/items/arrows}}'
        + '{@li любое воинское оружие + 10 зм}}',
    ]);

    expect(getStartingEquipmentMarkup([])).toEqual([]);
  });
});

describe('стартовое снаряжение в мастерской', () => {
  it('разбор из текста: ссылки — справочник, категории — выбор', () => {
    const lines = parseStartingEquipmentText(FIGHTER_TEXT);

    expect(lines).toHaveLength(2);

    expect(lines[0]?.options[1]?.items).toEqual([
      {
        kind: 'ITEM',
        section: 'ARMOR',
        url: '/armors/leather_armor',
        name: 'кожаный доспех',
        quantity: 1,
        description: '',
        category: null,
      },
      {
        kind: 'ITEM',
        section: 'WEAPON',
        url: '/weapons/longbow',
        name: 'длинный лук',
        quantity: 1,
        description: '',
        category: null,
      },
      {
        kind: 'ITEM',
        section: 'ITEM',
        url: '/items/arrows',
        name: 'стрел',
        quantity: 20,
        description: '',
        category: null,
      },
    ]);

    expect(lines[1]?.options.map((option) => option.items)).toEqual([
      [
        expect.objectContaining({
          kind: 'CHOICE',
          category: 'MARTIAL_WEAPON',
          quantity: 1,
        }),
        expect.objectContaining({ kind: 'ITEM', url: '/armors/shield' }),
      ],
      [
        expect.objectContaining({
          kind: 'CHOICE',
          category: 'MARTIAL_WEAPON',
          quantity: 2,
        }),
      ],
    ]);
  });

  it('текст без списка — пусто', () => {
    expect(parseStartingEquipmentText(['Просто текст'])).toEqual([]);
  });

  it('категория по тексту позиции', () => {
    expect(findStartingEquipmentCategory('любое простое оружие')).toBe(
      'SIMPLE_WEAPON',
    );

    expect(findStartingEquipmentCategory('простое рукопашное оружие')).toBe(
      'SIMPLE_MELEE_WEAPON',
    );

    expect(findStartingEquipmentCategory('музыкальный инструмент')).toBe(
      'INSTRUMENT',
    );

    expect(findStartingEquipmentCategory('священный символ')).toBeNull();
  });

  it('форма и обратно: пустое уточнение — null, пусто — не заполнено', () => {
    const form = toStartingEquipmentForm(STRUCTURED);

    expect(form[0]?.options[0]?.items[0]?.description).toBe('');
    expect(getStartingEquipmentPayload(form)).toEqual(STRUCTURED);
    expect(getStartingEquipmentPayload([])).toBeNull();
  });

  it('свой предмет без записи теряет раздел, выбор — адрес', () => {
    const [line] =
      getStartingEquipmentPayload([
        {
          options: [
            {
              coins: 0,
              items: [
                {
                  kind: 'ITEM',
                  section: 'WEAPON',
                  url: '',
                  name: ' Факел ',
                  quantity: 3,
                  description: '  ',
                  category: 'ARMOR_LIGHT',
                },
                {
                  kind: 'CHOICE',
                  section: 'WEAPON',
                  url: '/weapons/club',
                  name: '',
                  quantity: 1,
                  description: 'на выбор',
                  category: 'INSTRUMENT',
                },
              ],
            },
          ],
        },
      ]) ?? [];

    expect(line?.options[0]).toEqual({
      coins: null,
      items: [
        {
          kind: 'ITEM',
          section: null,
          url: null,
          name: 'Факел',
          quantity: 3,
          description: null,
          category: null,
        },
        {
          kind: 'CHOICE',
          section: null,
          url: null,
          name: '',
          quantity: 1,
          description: 'на выбор',
          category: 'INSTRUMENT',
        },
      ],
    });
  });

  it('загрузка класса и сохранение отправляют снаряжение', () => {
    const heroClass = parseWorkshopClass({
      id: 1,
      name: { rus: 'Воин', eng: 'Fighter' },
      traits: { diceHp: 10, startingEquipment: STRUCTURED },
    });

    expect(heroClass.startingEquipment).toEqual(STRUCTURED);

    const form = createClassForm(heroClass);

    expect(getClassPayload(form, undefined).startingEquipment).toEqual(
      STRUCTURED,
    );

    expect(
      getClassPayload(createClassForm(), undefined).startingEquipment,
    ).toBeNull();
  });

  it('проверка формы: категория у выбора, позиция или монеты у варианта', () => {
    const form = {
      ...createClassForm(),
      name: 'Воин',
      englishName: 'Fighter',
      description: ['Описание'],
      startingEquipment: [
        {
          options: [
            { items: [], coins: null },
            {
              items: [
                {
                  kind: 'CHOICE' as const,
                  section: null,
                  url: null,
                  name: '',
                  quantity: 1001,
                  description: '',
                  category: null,
                },
              ],
              coins: null,
            },
          ],
        },
      ],
    };

    const result = classFormSchema.safeParse(form);

    const paths = (result.error?.issues ?? []).map((issue) =>
      issue.path.join('.'),
    );

    expect(paths).toEqual(
      expect.arrayContaining([
        'startingEquipment.0.options.0.items',
        'startingEquipment.0.options.1.items.0.category',
        'startingEquipment.0.options.1.items.0.quantity',
      ]),
    );
  });

  it('предпросмотр строки формы', () => {
    expect(
      formatStartingEquipmentFormLine(toStartingEquipmentForm(STRUCTURED)[1]!),
    ).toBe('любое воинское оружие + 10 зм');
  });

  it('перестановка элементов списка', () => {
    expect(moveListEntry(['а', 'б', 'в'], 0, 1)).toEqual(['б', 'а', 'в']);
    expect(moveListEntry(['а', 'б', 'в'], 2, -1)).toEqual(['а', 'в', 'б']);
    expect(moveListEntry(['а', 'б'], 0, -1)).toEqual(['а', 'б']);
  });
});

describe('стартовое снаряжение в мастере листа', () => {
  const lines = toWizardStartingEquipment(STRUCTURED);

  it('строки мастера: подписи текстом, разделы, монеты, категории', () => {
    expect(lines[0]?.options.map((option) => option.label)).toEqual([
      'кольчуга',
      'кожаный доспех, длинный лук и 20 стрел',
    ]);

    expect(lines[0]?.options[1]?.items.map((item) => item.kind)).toEqual([
      'armor',
      'weapon',
      'item',
    ]);

    expect(lines[1]?.options[0]).toEqual({
      label: 'любое воинское оружие + 10 зм',
      coins: 10,
      items: [
        {
          name: 'Воинское оружие',
          url: null,
          kind: 'weapon',
          quantity: 1,
          category: 'MARTIAL_WEAPON',
        },
      ],
    });
  });

  it('данные важнее текста, без данных — разбор текста', () => {
    expect(getClassStartingEquipment(STRUCTURED, FIGHTER_TEXT)).toEqual(lines);
    expect(getClassStartingEquipment(null, FIGHTER_TEXT)).toHaveLength(2);
  });

  it('выбор из категории: выбранная запись или свой предмет', () => {
    const picked = resolveChosenEquipment(lines, [1, 0], {
      [getEquipmentChoiceKey(1, 0, 0)]: {
        name: 'Длинный меч',
        url: '/weapons/longsword',
        caption: '',
      },
    });

    expect(picked.at(-1)).toEqual({
      name: 'Длинный меч',
      url: '/weapons/longsword',
      kind: 'weapon',
      quantity: 1,
    });

    expect(resolveChosenEquipment(lines, [0, 0], {})).toEqual([
      {
        name: 'Кольчуга',
        url: '/armors/chain_mail',
        kind: 'armor',
        quantity: 1,
      },
      { name: 'Воинское оружие', url: null, kind: 'weapon', quantity: 1 },
    ]);
  });

  it('монеты выбранных вариантов', () => {
    expect(getChosenCoins(lines, [0, 0])).toBe(10);
    expect(getChosenCoins(lines.slice(0, 1), [1])).toBe(0);
  });

  it('список для выбора: оружие по типу, доспехи и инструменты фильтром', () => {
    const weapons = [
      {
        name: { rus: 'Дубинка', eng: 'Club' },
        url: '/weapons/club',
        type: { name: 'Простое рукопашное', order: 0 },
      },
      {
        name: { rus: 'Длинный лук', eng: 'Longbow' },
        url: '/weapons/longbow',
        type: { name: 'Воинское дальнобойное', order: 3 },
      },
    ];

    expect(
      toEquipmentChoiceOptions('MARTIAL_WEAPON', weapons).map(
        (option) => option.url,
      ),
    ).toEqual(['/weapons/longbow']);

    expect(
      toEquipmentChoiceOptions('SIMPLE_MELEE_WEAPON', weapons).map(
        (option) => option.url,
      ),
    ).toEqual(['/weapons/club']);

    expect(getEquipmentChoiceRequest('MARTIAL_WEAPON').filter).toBeUndefined();

    expect(getEquipmentChoiceRequest('ARMOR_HEAVY').filter).toEqual({
      type: ['HEAVY'],
      book: [],
    });

    expect(getEquipmentChoiceRequest('INSTRUMENT').filter).toEqual({
      category: ['MUSICAL_INSTRUMENTS'],
      book: [],
    });
  });
});
