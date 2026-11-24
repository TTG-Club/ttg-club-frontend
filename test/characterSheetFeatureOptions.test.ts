import type { SheetDocument, SheetSource } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  classMechanicsDetailSchema,
  createEmptySheetDocument,
  createSource,
  getSourceChoices,
  syncFeatureOptionChoices,
} from '~character-sheet/model';

const WARLOCK = classMechanicsDetailSchema.parse({
  traits: {
    features: [
      {
        id: 'c33',
        name: 'Таинственные воззвания',
        level: 2,
        optionsName: 'Воззвания',
        options: [
          { name: 'Мучительный взрыв', url: '/options/agonizing_blast' },
          {
            name: 'Жажда жизни',
            url: '/options/thirsting_blade',
            level: 5,
          },
        ],
        optionsChoice: { count: 2, scaling: [{ level: 5, count: 3 }] },
      },
      { id: 'c35', name: 'Увеличение характеристик', level: 4 },
    ],
  },
});

/**
 * Источник умения колдуна.
 * @param mechanics - механика источника
 */
function makeSource(mechanics: SheetSource['mechanics']): SheetSource {
  return createSource({
    kind: 'classFeature',
    name: 'Таинственные воззвания',
    url: '/classes/warlock#c33',
    classId: 'warlock',
    level: 2,
    characterLevel: 2,
    mechanics,
    activeEffects: [],
  });
}

/**
 * Лист колдуна нужного уровня с источником умения.
 * @param level - уровень колдуна
 * @param source - источник умения
 */
function makeDocument(level: number, source: SheetSource): SheetDocument {
  return {
    ...createEmptySheetDocument(),
    classes: [
      {
        id: 'warlock',
        name: 'Колдун',
        url: '/classes/warlock',
        archetypeName: null,
        archetypeUrl: null,
        level,
        hitDie: 8,
        hitPointGains: [],
        spellcastingAbility: null,
      },
    ],
    sources: [source],
  };
}

describe('варианты умения в листе', () => {
  it('варианты становятся выбором особенности класса', () => {
    const feature = WARLOCK.traits?.features[0];
    const choice = feature?.mechanics?.choices?.[0];

    expect(choice).toMatchObject({
      key: 'featureOptions:c33',
      type: 'OPTION',
      label: 'Воззвания',
      count: 2,
    });

    expect(choice?.options?.map((option) => option.value)).toEqual([
      '/options/agonizing_blast',
      '/options/thirsting_blade',
    ]);

    expect(WARLOCK.traits?.features[1]?.mechanics ?? null).toBeNull();
  });

  it('количество растёт, варианты открываются со своего уровня', () => {
    const source = makeSource(WARLOCK.traits?.features[0]?.mechanics ?? null);

    const [second] = getSourceChoices(source, 2);
    const [fifth] = getSourceChoices(source, 5);

    expect(second?.kind).toBe('option');
    expect(second?.count).toBe(2);

    expect(second?.options.map((option) => option.label)).toEqual([
      'Мучительный взрыв',
    ]);

    expect(fifth?.count).toBe(3);
    expect(fifth?.options).toHaveLength(2);
  });

  it('старый лист получает выбор, повторная досинхронизация ничего не меняет', () => {
    const document = makeDocument(3, makeSource(null));

    const getDetail = (url: string | null) =>
      url === '/classes/warlock' ? WARLOCK : undefined;

    const synced = syncFeatureOptionChoices(document, getDetail);

    expect(synced?.sources[0]?.mechanics?.choices?.[0]?.key).toBe(
      'featureOptions:c33',
    );

    expect(
      synced ? syncFeatureOptionChoices(synced, getDetail) : 'none',
    ).toBeNull();
  });

  it('без вариантов в карточке лист не меняется', () => {
    const document = makeDocument(3, makeSource(null));

    expect(syncFeatureOptionChoices(document, () => undefined)).toBeNull();
  });
});
