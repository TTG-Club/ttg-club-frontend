import type { ClassTrait } from '~workshop/model';

import { describe, expect, it } from 'vitest';

import {
  classDetailSchema,
  getClassFeatureOptionSearchText,
} from '~character/model';
import {
  createClassForm,
  createClassTrait,
  createClassTraitOption,
  createClassTraitOptionsStep,
  getClassPayload,
  parseWorkshopOption,
} from '~workshop/model';

describe('варианты умения в мастерской', () => {
  it('новая ступень — на уровень позже и на вариант больше', () => {
    expect(
      createClassTraitOptionsStep({ label: '', count: 2, scaling: [] }, 2),
    ).toEqual({ level: 3, count: 3 });

    expect(
      createClassTraitOptionsStep(
        { label: '', count: 2, scaling: [{ level: 5, count: 3 }] },
        2,
      ),
    ).toEqual({ level: 6, count: 4 });
  });

  it('тело запроса: варианты уходят всегда, пустые поля — undefined', () => {
    const trait: ClassTrait = {
      ...createClassTrait(),
      name: 'Таинственные воззвания',
      level: 2,
      description: ['Текст'],
      optionsType: 'ELDRITCH_INVOCATION',
      optionsName: 'Воззвания',
      options: [
        {
          ...createClassTraitOption(),
          name: ' Мучительный взрыв ',
          englishName: 'Agonizing Blast',
          prerequisite: '',
          description: ['', 'Описание'],
        },
      ],
      optionsChoice: {
        label: '',
        count: 2,
        scaling: [
          { level: 7, count: 4 },
          { level: 5, count: 3 },
        ],
      },
    };

    const [payload] = getClassPayload(
      { ...createClassForm(), classTraits: [trait] },
      undefined,
    ).classTraits as Array<Record<string, unknown>>;

    expect(payload).toMatchObject({
      optionsType: 'ELDRITCH_INVOCATION',
      optionsName: 'Воззвания',
      options: [
        expect.objectContaining({
          name: 'Мучительный взрыв',
          prerequisite: undefined,
          description: ['Описание'],
        }),
      ],
      optionsChoice: {
        label: undefined,
        count: 2,
        scaling: [
          { level: 5, count: 3 },
          { level: 7, count: 4 },
        ],
      },
    });

    const [empty] = getClassPayload(
      { ...createClassForm(), classTraits: [createClassTrait()] },
      undefined,
    ).classTraits as Array<Record<string, unknown>>;

    expect(empty).toMatchObject({
      optionsType: undefined,
      options: [],
      optionsChoice: null,
    });
  });

  it('особенность, которая правится в умении, знает это умение', () => {
    const option = parseWorkshopOption({
      id: 1,
      name: { rus: 'Мучительный взрыв', eng: 'Agonizing Blast' },
      source: { shortName: 'PHB', name: 'Книга игрока' },
      featureUrl: '/classes/warlock#c33',
      featureName: 'Таинственные воззвания',
    });

    expect(option.feature).toEqual({
      url: '/classes/warlock#c33',
      name: 'Таинственные воззвания',
    });
  });
});

describe('варианты умения на странице класса', () => {
  it('карточка класса разбирает варианты умения', () => {
    const entry = classDetailSchema.parse({
      name: { rus: 'Колдун', eng: 'Warlock' },
      url: '/classes/warlock',
      source: { shortName: 'PHB', name: 'Книга игрока' },
      traits: {
        diceHp: 8,
        skillAvailableCount: 2,
        features: [
          {
            id: 'c33',
            name: 'Таинственные воззвания',
            level: 2,
            optionsName: 'Воззвания',
            options: [
              {
                name: 'Мучительный взрыв',
                url: '/options/agonizing_blast',
                prerequisite: 'Заклинание «Мистический заряд»',
              },
            ],
          },
          { id: 'c34', name: 'Предмет договора', level: 3 },
        ],
      },
    });

    const [invocations, pact] = entry.traits?.features ?? [];

    expect(invocations?.options[0]?.url).toBe('/options/agonizing_blast');
    expect(pact?.options).toEqual([]);
  });
});

describe('поиск по вариантам умения', () => {
  it('ищет по английскому названию и тексту описания без разметки', () => {
    const htmlText = getClassFeatureOptionSearchText({
      name: 'Первобытный удар',
      englishName: 'Primal Strike',
      url: '/options/primal_strike',
      description:
        '<p>Дополнительно <dice-roller formula="1к8"/> урона <b>холодом</b>.</p>',
    });

    expect(htmlText).toContain('primal strike');
    expect(htmlText).toContain('урона холодом');
    expect(htmlText).not.toContain('<b>');

    const markupText = getClassFeatureOptionSearchText({
      name: 'Могущественное колдовство',
      url: '/options/potent_spellcasting',
      prerequisite: 'Друид 8 уровня',
      description: ['Добавляйте модификатор {@b Мудрости} к урону.'],
    });

    expect(markupText).toContain('друид 8 уровня');
    expect(markupText).toContain('модификатор мудрости к урону');
  });
});
