import { describe, expect, it } from 'vitest';

import {
  buildFilterPayload,
  buildListRequest,
  filterResponseSchema,
  getDefaultSelection,
  groupItems,
  isSelectionCustomized,
  mergeQuery,
  normalizeFilter,
  selectionFromQuery,
  selectionToQuery,
  setGroupSelection,
} from '~section/model';

const definition = normalizeFilter(
  filterResponseSchema.parse({
    sources: [
      {
        name: 'Официальные',
        key: 'OFFICIAL',
        values: [
          { label: 'PHB', key: 'PHB', default: true },
          { label: 'XGE', key: 'XGE', default: true },
        ],
      },
      {
        name: 'Хомрул',
        key: 'HOMEBREW',
        values: [{ label: 'HB', key: 'HB', default: false }],
      },
    ],
    other: [
      {
        name: 'Уровень',
        key: 'level',
        values: [
          { label: 'Заговор', key: 0, default: false },
          { label: '1', key: 1, default: false },
        ],
      },
    ],
  }),
);

describe('фильтр раздела', () => {
  it('собирает источники в общий параметр book', () => {
    expect(getDefaultSelection(definition)).toEqual({
      book: ['PHB', 'XGE'],
      level: [],
    });
  });

  it('пишет в адрес только изменённые группы', () => {
    const selection = setGroupSelection(
      getDefaultSelection(definition),
      definition.other[0]!,
      ['0', '1'],
    );

    expect(selectionToQuery(definition, selection)).toEqual({
      book: undefined,
      level: '0,1',
    });

    expect(isSelectionCustomized(definition, selection)).toBe(true);
  });

  it('читает выбор из адреса и отбрасывает неизвестные ключи', () => {
    const selection = selectionFromQuery(definition, {
      book: 'HB,EVIL',
      level: '1',
    });

    expect(selection).toEqual({ book: ['HB'], level: ['1'] });
  });

  it('возвращает ключам в запросе тип из API', () => {
    const selection = selectionFromQuery(definition, { level: '0' });

    expect(buildFilterPayload(definition, selection)).toEqual({
      book: ['PHB', 'XGE'],
      level: [0],
    });
  });

  it('не трогает соседние группы источников при выборе в одной', () => {
    const selection = setGroupSelection(
      getDefaultSelection(definition),
      definition.sources[1]!,
      ['HB'],
    );

    expect(selection.book).toEqual(['PHB', 'XGE', 'HB']);
  });

  it('принимает фильтр списком групп', () => {
    const plain = normalizeFilter(
      filterResponseSchema.parse([
        { key: 'type', name: 'Тип', values: [{ label: 'a', key: 'a' }] },
      ]),
    );

    expect(plain.other[0]).toMatchObject({ param: 'type', hidden: false });
  });
});

describe('buildListRequest', () => {
  it('добавляет поиск и фильтр, только если они есть', () => {
    expect(buildListRequest({ page: 0, size: 60 })).toEqual({
      page: 0,
      size: 60,
    });

    expect(
      buildListRequest({
        page: 1,
        size: 60,
        search: 'щит',
        filter: { level: [1] },
      }),
    ).toEqual({
      page: 1,
      size: 60,
      search: { value: 'щит', exact: false },
      filter: { level: [1] },
    });
  });
});

describe('groupItems', () => {
  it('делит список на группы подряд идущих записей', () => {
    expect(groupItems([1, 1, 2], (item) => String(item))).toEqual([
      { name: '1', items: [1, 1] },
      { name: '2', items: [2] },
    ]);
  });
});

describe('mergeQuery', () => {
  it('накладывает изменения и убирает пустые параметры', () => {
    expect(
      mergeQuery(
        { search: 'огонь', level: '1' },
        { level: undefined, book: 'PHB' },
      ),
    ).toEqual({ search: 'огонь', book: 'PHB' });
  });

  it('приводит числа к строкам, как в адресе', () => {
    expect(mergeQuery({}, { page: 2, tags: [1, 'a'] })).toEqual({
      page: '2',
      tags: ['1', 'a'],
    });
  });
});
