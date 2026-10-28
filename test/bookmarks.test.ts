import { describe, expect, it } from 'vitest';

import {
  bookmarkListSchema,
  buildBookmarkTree,
  countBookmarkItems,
  findItemInGroup,
  removeBookmarkEntry,
} from '~bookmarks/model';

const entries = bookmarkListSchema.parse([
  { uuid: 'g1', name: 'Общие', order: -1 },
  { uuid: 'g2', name: 'Кампания', order: 0 },
  { uuid: 'c1', name: 'Заклинания', order: 5, parentUUID: 'g1' },
  { uuid: 'c2', name: 'Заклинания', order: 5, parentUUID: 'g2' },
  {
    uuid: 'b2',
    name: 'Щит',
    order: 1,
    parentUUID: 'c1',
    url: '/spells/shield',
  },
  {
    uuid: 'b1',
    name: 'Огненный шар',
    order: 0,
    parentUUID: 'c1',
    url: '/spells/fireball',
  },
  {
    uuid: 'b3',
    name: 'Щит',
    order: 0,
    parentUUID: 'c2',
    url: '/spells/shield',
  },
]);

describe('закладки', () => {
  it('собирает дерево групп, категорий и ссылок по порядку', () => {
    const tree = buildBookmarkTree(entries);

    expect(tree.map((group) => group.name)).toEqual(['Общие', 'Кампания']);

    expect(tree[0]?.children[0]?.children.map((item) => item.uuid)).toEqual([
      'b1',
      'b2',
    ]);
  });

  it('ищет ссылку только внутри своей группы', () => {
    expect(findItemInGroup(entries, '/spells/shield', 'g2')?.uuid).toBe('b3');
    expect(findItemInGroup(entries, '/spells/fireball', 'g2')).toBeUndefined();
  });

  it('удаляет опустевшую категорию вместе с последней ссылкой', () => {
    const rest = removeBookmarkEntry(entries, 'b3');

    expect(rest.some((entry) => entry.uuid === 'c2')).toBe(false);
    expect(rest.some((entry) => entry.uuid === 'g2')).toBe(true);
  });

  it('удаляет группу со всем содержимым', () => {
    const rest = removeBookmarkEntry(entries, 'g1');

    expect(rest.map((entry) => entry.uuid)).toEqual(['g2', 'c2', 'b3']);
    expect(countBookmarkItems(rest)).toBe(1);
  });

  it('принимает null из API как отсутствие поля', () => {
    const [group] = bookmarkListSchema.parse([
      { uuid: 'g', name: 'Общие', order: null, parentUUID: null, url: null },
    ]);

    expect(group).toEqual({
      uuid: 'g',
      name: 'Общие',
      order: 0,
      parentUUID: undefined,
      url: undefined,
    });
  });
});
