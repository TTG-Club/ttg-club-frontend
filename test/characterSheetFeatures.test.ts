import { describe, expect, it } from 'vitest';

import {
  FEAT_CATALOG_SOURCE,
  getFeatureOriginOrder,
  getSourceFeatureOrigin,
  sheetDocumentSchema,
  sheetFeatureSchema,
  sheetNoteSchema,
} from '~character-sheet/model';

describe('тексты листа в разметке', () => {
  it('старая строка заметки делится на абзацы', () => {
    const note = sheetNoteSchema.parse({
      id: 'n1',
      title: 'Задания',
      text: 'Первый абзац.\n\n  Второй абзац.  \n\n\n',
    });

    expect(note.text).toEqual(['Первый абзац.', 'Второй абзац.']);
  });

  it('блоки остаются, пустые отбрасываются, мусор даёт пустой текст', () => {
    expect(
      sheetNoteSchema.parse({ id: 'n', title: '', text: ['а', ' ', 'б'] }).text,
    ).toEqual(['а', 'б']);

    expect(
      sheetNoteSchema.parse({ id: 'n', title: '', text: 42 }).text,
    ).toEqual([]);
  });

  it('личность старого листа читается, приметы пустые', () => {
    const document = sheetDocumentSchema.parse({
      personality: {
        traits: 'Смелый',
        ideals: '',
        bonds: 'Семья\n\nДруг',
        flaws: '',
        appearance: '',
        backstory: '',
      },
    });

    expect(document.personality.traits).toEqual(['Смелый']);
    expect(document.personality.ideals).toEqual([]);
    expect(document.personality.bonds).toEqual(['Семья', 'Друг']);
    expect(document.personality.age).toBe('');
  });
});

describe('особенности', () => {
  it('своя особенность старого листа получает источник и выбор', () => {
    const feature = sheetFeatureSchema.parse({
      id: 'f1',
      name: 'Удача',
      source: 'Полурослик',
      description: 'Перебросьте 1.',
    });

    expect(feature.origin).toBe('custom');
    expect(feature.choice).toBe('');
    expect(feature.description).toEqual(['Перебросьте 1.']);
  });

  it('вид источника по записи механики и порядок групп', () => {
    expect(getSourceFeatureOrigin('subrace')).toBe('race');
    expect(getSourceFeatureOrigin('background')).toBe('background');
    expect(getSourceFeatureOrigin('asi')).toBe('feat');
    expect(getSourceFeatureOrigin('classFeature')).toBe('class');

    expect(getFeatureOriginOrder('race')).toBeLessThan(
      getFeatureOriginOrder('class'),
    );

    expect(getFeatureOriginOrder('feat')).toBeLessThan(
      getFeatureOriginOrder('custom'),
    );
  });

  it('черты справочника группируются по книге, требования — подписью', () => {
    const rows = FEAT_CATALOG_SOURCE.parseRows([
      {
        name: { rus: 'Удачливый', eng: 'Lucky' },
        url: '/feats/lucky',
        source: { shortName: 'PHB', name: 'Книга игрока' },
      },
      {
        name: { rus: 'Тяжёлый доспех', eng: 'Heavily armored' },
        url: '/feats/heavily_armored',
        requirements: 'Владение средними доспехами',
        source: { shortName: 'XGE', name: 'Руководство Занатара' },
      },
      {
        name: { rus: 'Без книги', eng: 'No book' },
        url: '/feats/no_book',
      },
    ]);

    expect(rows.map((row) => row.group)).toEqual([
      'Книга игрока',
      'Руководство Занатара',
      'Прочие',
    ]);

    expect(rows[1]?.caption).toBe('Владение средними доспехами');
    expect(rows[0]?.groupOrder).toBeLessThan(rows[1]?.groupOrder ?? 0);
  });
});
