import { describe, expect, it } from 'vitest';

import {
  applyExcludedSources,
  buildFilterPayload,
  buildListRequest,
  EntryExportPlatform,
  filterResponseSchema,
  getDefaultSelection,
  getDetailPath,
  getDetailSlug,
  getEntryExportUrl,
  getExcludedSources,
  getExportFileName,
  getSelectAllState,
  getSourceFilterValue,
  groupItems,
  isFilterSearchable,
  isPartCustomized,
  isSelectionCustomized,
  mergeQuery,
  normalizeFilter,
  resetSelectionPart,
  searchFilterGroups,
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
  it('собирает записи одной группы вместе, даже вперемешку', () => {
    expect(groupItems([1, 2, 1], (item) => String(item))).toEqual([
      { name: '1', items: [1, 1] },
      { name: '2', items: [2] },
    ]);
  });

  it('ставит группы по порядку, а записи внутри группы не трогает', () => {
    const items = [
      { name: 'Алебарда', type: 'Воинское', order: 2 },
      { name: 'Булава', type: 'Простое', order: 1 },
      { name: 'Глефа', type: 'Воинское', order: 2 },
    ];

    expect(
      groupItems(
        items,
        (item) => item.type,
        (item) => item.order,
      ).map((group) => [group.name, group.items.map((item) => item.name)]),
    ).toEqual([
      ['Простое', ['Булава']],
      ['Воинское', ['Алебарда', 'Глефа']],
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

describe('части фильтра', () => {
  const selection = {
    book: ['PHB'],
    level: ['1'],
  };

  it('отличает изменённые источники от изменённого содержимого', () => {
    expect(isPartCustomized(definition, selection, 'sources')).toBe(true);
    expect(isPartCustomized(definition, selection, 'other')).toBe(true);

    expect(
      isPartCustomized(
        definition,
        { ...getDefaultSelection(definition), level: ['1'] },
        'sources',
      ),
    ).toBe(false);
  });

  it('сбрасывает одну часть, не трогая другую', () => {
    expect(resetSelectionPart(definition, selection, 'sources')).toEqual({
      book: ['PHB', 'XGE'],
      level: ['1'],
    });

    expect(resetSelectionPart(definition, selection, 'other')).toEqual({
      book: ['PHB'],
      level: [],
    });
  });
});

describe('getDetailSlug и getDetailPath', () => {
  it('хранит в ?detail= адрес записи без раздела и собирает его обратно', () => {
    expect(getDetailSlug('/spells', '/spells/fireball')).toBe('fireball');
    expect(getDetailSlug('/races', '/races/elf/high')).toBe('elf/high');
    expect(getDetailPath('/races', 'elf/high')).toBe('/races/elf/high');
  });

  it('не собирает адрес из пустого значения и сегментов с точками', () => {
    expect(getDetailPath('/spells', undefined)).toBeUndefined();
    expect(getDetailPath('/spells', '')).toBeUndefined();
    expect(getDetailPath('/spells', '../admin')).toBeUndefined();
    expect(getDetailPath('/spells', 'a//b')).toBeUndefined();
  });
});

describe('searchFilterGroups', () => {
  const groups = definition.other;

  it('без запроса оставляет все группы целиком', () => {
    expect(searchFilterGroups(groups, '  ')).toHaveLength(groups.length);
  });

  it('оставляет группу целиком по названию, иначе подошедшие значения', () => {
    const [first] = groups;

    if (!first) {
      throw new Error('в фильтре нет групп');
    }

    expect(searchFilterGroups(groups, first.name.toUpperCase())[0]).toEqual({
      group: first,
      values: first.values,
    });

    const [value] = first.values;

    if (value) {
      const matches = searchFilterGroups([first], value.label.slice(1));

      expect(matches[0]?.values).toContainEqual(value);
    }

    expect(searchFilterGroups(groups, 'нет такого значения')).toEqual([]);
  });

  it('находит книгу по названию из подсказки', () => {
    const book = {
      label: 'PHB',
      key: 'PHB',
      default: true,
      tooltip: 'Книга игрока',
    };

    const group = {
      name: 'Официальные',
      key: 'OFFICIAL',
      param: 'book',
      hidden: false,
      values: [book],
    };

    expect(searchFilterGroups([group], 'игрока')[0]?.values).toEqual([book]);
  });
});

describe('getSourceFilterValue', () => {
  it('подписывает книгу названием, а сокращение уносит в подсказку', () => {
    expect(
      getSourceFilterValue({
        label: 'PHB',
        key: 'PHB',
        default: true,
        tooltip: 'Книга игрока',
      }),
    ).toEqual({
      label: 'Книга игрока',
      key: 'PHB',
      default: true,
      tooltip: 'PHB',
    });
  });

  it('без названия оставляет сокращение', () => {
    const value = { label: 'HB', key: 'HB', default: false };

    expect(getSourceFilterValue(value)).toBe(value);
  });
});

describe('isFilterSearchable', () => {
  it('нужен при больше пяти группах', () => {
    const [first] = definition.other;

    if (!first) {
      throw new Error('в фильтре нет групп');
    }

    expect(isFilterSearchable([first])).toBe(false);

    expect(isFilterSearchable(Array.from({ length: 6 }, () => first))).toBe(
      true,
    );
  });
});

describe('getSelectAllState', () => {
  it('отмечает «Выбрать все» целиком, чёрточкой или пустым', () => {
    expect(getSelectAllState(['PHB', 'XGE'], [])).toBe(false);
    expect(getSelectAllState(['PHB', 'XGE'], ['PHB'])).toBe('indeterminate');
    expect(getSelectAllState(['PHB', 'XGE'], ['XGE', 'PHB'])).toBe(true);
  });
});

describe('источники по умолчанию из личного кабинета', () => {
  it('снимает убранные книги в выборе по умолчанию', () => {
    const personal = applyExcludedSources(definition, ['XGE']);

    expect(getDefaultSelection(personal)).toEqual({
      book: ['PHB'],
      level: [],
    });

    // Условия по содержимому не трогаются
    expect(personal.other).toBe(definition.other);
  });

  it('без убранных книг оставляет фильтр как есть', () => {
    expect(applyExcludedSources(definition, [])).toBe(definition);
  });

  it('адрес остаётся чистым, а запрос получает личный выбор', () => {
    const personal = applyExcludedSources(definition, ['XGE']);
    const selection = selectionFromQuery(personal, {});

    expect(isSelectionCustomized(personal, selection)).toBe(false);
    expect(isSelectionCustomized(definition, selection)).toBe(true);

    expect(buildFilterPayload(personal, selection)).toEqual({
      book: ['PHB'],
      level: [],
    });
  });

  it('собирает снятые книги из выбора', () => {
    expect(
      getExcludedSources(definition, { book: ['PHB'], level: ['1'] }),
    ).toEqual(['XGE', 'HB']);
  });
});

describe('экспорт записи', () => {
  it('собирает ручку экспорта, как старый SPA', () => {
    expect(getEntryExportUrl(EntryExportPlatform.FOUNDRY, 'spell', 7)).toBe(
      '/api/v1/fvtt/spell?id=7',
    );
  });

  it('берёт имя файла из заголовка ответа', () => {
    expect(
      getExportFileName('attachment; filename="Fire Bolt.json"', 'Fire Bolt'),
    ).toBe('Fire Bolt.json');
  });

  it('без заголовка называет файл по записи', () => {
    expect(getExportFileName(null, 'Goblin')).toBe('Goblin.json');
  });
});
