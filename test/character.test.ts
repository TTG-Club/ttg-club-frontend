import { describe, expect, it } from 'vitest';

import {
  backgroundDetailSchema,
  getBackgroundLanguages,
  getRequirementsLabel,
  getSpellComponentLabels,
  getSpellGroup,
  getSpellTypeLabel,
  hasPersonalization,
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
