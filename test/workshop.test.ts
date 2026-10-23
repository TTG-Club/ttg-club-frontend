import { describe, expect, it } from 'vitest';

import {
  createSpellForm,
  describeHtmlProblem,
  extractFormula,
  getHtmlValidityMessage,
  getSpellPayload,
  getSpellSchoolValue,
  getWorkshopEditRoute,
  getWorkshopSlug,
  parseBookSources,
  parseRevisions,
  parseSpellTime,
  parseWorkshopSpell,
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
