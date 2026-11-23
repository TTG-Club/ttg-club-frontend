import type { ClassFeature } from '~character/model';
import type { ClassTrait } from '~workshop/model';

import { describe, expect, it } from 'vitest';

import {
  classMechanicsDetailSchema,
  getClassLevelFeatures,
} from '~character-sheet/model';
import { getClassFeatureScalingView } from '~character/model';
import {
  createClassForm,
  createClassTrait,
  createClassTraitScaling,
  getClassPayload,
} from '~workshop/model';

/**
 * Умение карточки класса с ростом.
 * @param patch - правки
 */
function makeFeature(patch: Partial<ClassFeature> = {}): ClassFeature {
  return {
    id: 'c5',
    name: 'Увеличение характеристик',
    level: 4,
    scaling: [],
    ...patch,
  };
}

describe('рост умения в мастерской', () => {
  it('новый уровень — на уровень позже последнего', () => {
    expect(createClassTraitScaling([], 4).level).toBe(5);

    const rows = [{ ...createClassTraitScaling([], 4), level: 12 }];

    expect(createClassTraitScaling(rows, 4).level).toBe(13);

    expect(createClassTraitScaling([{ ...rows[0]!, level: 20 }], 4).level).toBe(
      20,
    );
  });

  it('тело запроса: рост по уровням, пустые поля — null', () => {
    const trait: ClassTrait = {
      ...createClassTrait(),
      name: 'Увеличение характеристик',
      level: 4,
      description: ['Текст'],
      scaling: [
        {
          level: 12,
          name: ' ',
          additional: '',
          description: ['', 'Своё'],
          hideInSubclasses: true,
        },
        {
          level: 8,
          name: '',
          additional: '(2)',
          description: [],
          hideInSubclasses: false,
        },
      ],
    };

    const payload = getClassPayload(
      { ...createClassForm(), classTraits: [trait] },
      undefined,
    );

    expect(payload.classTraits).toEqual([
      expect.objectContaining({
        scaling: [
          {
            level: 8,
            name: undefined,
            additional: '(2)',
            description: [],
            hideInSubclasses: false,
          },
          {
            level: 12,
            name: undefined,
            additional: undefined,
            description: ['Своё'],
            hideInSubclasses: true,
          },
        ],
      }),
    ]);
  });
});

describe('рост умения на странице класса', () => {
  it('уровни перечислены, уровни со своим описанием — отдельно', () => {
    const view = getClassFeatureScalingView(
      makeFeature({
        scaling: [
          {
            level: 12,
            description: ['Текст 12'],
            name: 'Своё',
            additional: '(3)',
          },
          { level: 8 },
          { level: 16, hideInSubclasses: true },
        ],
      }),
      false,
    );

    expect(view.levels).toBe('8, 12, 16');
    expect(view.rows).toHaveLength(1);
    expect(view.rows[0]?.title).toBe('12-й уровень: Своё (3)');
  });

  it('на странице подкласса скрытые строки не видны', () => {
    const view = getClassFeatureScalingView(
      makeFeature({
        scaling: [{ level: 8 }, { level: 16, hideInSubclasses: true }],
      }),
      true,
    );

    expect(view.levels).toBe('8');
  });
});

describe('рост умения в листе', () => {
  it('повтор — отдельное умение уровня без механики', () => {
    const detail = classMechanicsDetailSchema.parse({
      traits: {
        features: [
          {
            id: 'c5',
            name: 'Увеличение характеристик',
            level: 4,
            mechanics: { feats: [] },
            scaling: [{ level: 8 }, { level: 11, name: 'Особое' }],
          },
        ],
      },
    });

    const eighth = getClassLevelFeatures(detail, 8);

    expect(eighth).toHaveLength(1);
    expect(eighth[0]?.id).toBe('c5~8');
    expect(eighth[0]?.isAbilityImprovement).toBe(true);
    expect(eighth[0]?.mechanics).toBeNull();
    expect(getClassLevelFeatures(detail, 11)[0]?.name).toBe('Особое');
    expect(getClassLevelFeatures(detail, 4)[0]?.id).toBe('c5');
  });
});
