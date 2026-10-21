import { describe, expect, it } from 'vitest';

import {
  backgroundDetailSchema,
  getBackgroundLanguages,
  getRequirementsLabel,
  hasPersonalization,
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
