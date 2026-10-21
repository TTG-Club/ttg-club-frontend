import { describe, expect, it } from 'vitest';

import {
  backgroundDetailSchema,
  getBackgroundLanguages,
  getRaceAbilitiesLabel,
  getRaceEditPath,
  getRaceSpeedLabel,
  getRequirementsLabel,
  getSpellComponentLabels,
  getSpellGroup,
  getSpellTypeLabel,
  groupSubraces,
  hasPersonalization,
  raceLinkSchema,
  sortRaces,
  spellDetailSchema,
} from '~character/model';

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
    const sorted = sortRaces([
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
    const groups = groupSubraces([
      { ...race('Морской'), type: { name: 'UA', order: 2 } },
      race('Высший'),
      race('Лесной'),
    ]);

    expect(groups.map((group) => [group.name, group.items.length])).toEqual([
      ['Официальные источники', 2],
      ['UA', 1],
    ]);
  });

  it('правка разновидности ведёт в мастерскую рас', () => {
    expect(getRaceEditPath('/races/elf/high')).toBe(
      '/workshop/races/high/edit',
    );
  });
});
