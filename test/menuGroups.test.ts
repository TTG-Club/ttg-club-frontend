import { describe, expect, it } from 'vitest';

import {
  buildMenuGroups,
  TOKENATOR_LEGACY_URL,
  TOKENATOR_URL,
  toTtgIcon,
  VTTG_MENU_GROUP,
} from '~infrastructure/sidebar/menu/model';

describe('toTtgIcon', () => {
  it('переводит путь спрайта в иконку локальной коллекции', () => {
    expect(toTtgIcon('menu/filled/wiki')).toBe('ttg:menu-filled-wiki');
  });

  it('оставляет группу без иконки', () => {
    expect(toTtgIcon(undefined)).toBeUndefined();
  });
});

describe('buildMenuGroups', () => {
  const items = [
    {
      name: 'Инструменты',
      order: 2,
      icon: 'menu/filled/tools',
      children: [
        { name: 'Токенатор', url: TOKENATOR_LEGACY_URL, order: 2 },
        { name: 'Таверна', url: '/tools/tavern', order: 1 },
      ],
    },
    {
      name: 'Персонаж',
      order: 1,
      children: [
        { name: 'Классы', url: '/classes', order: 1 },
        { name: 'Черновик', url: '/draft', order: 2, onlyDev: true },
      ],
    },
    { name: 'Скрытая', order: 3, onlyDev: true, children: [] },
  ];

  it('сортирует группы и пункты и добавляет Virtual TTG', () => {
    const groups = buildMenuGroups(items, false);

    expect(groups.map((group) => group.label)).toEqual([
      'Персонаж',
      'Инструменты',
      VTTG_MENU_GROUP.label,
    ]);

    expect(groups[1]?.icon).toBe('ttg:menu-filled-tools');
  });

  it('прячет пункты только для разработки вне dev', () => {
    expect(buildMenuGroups(items, false)[0]?.links).toEqual([
      { label: 'Классы', url: '/classes', external: false },
    ]);

    expect(buildMenuGroups(items, true)).toHaveLength(4);
  });

  it('ведёт токенатор на новый сайт и оставляет старую версию рядом', () => {
    expect(buildMenuGroups(items, false)[1]?.links).toEqual([
      { label: 'Таверна', url: '/tools/tavern', external: false },
      { label: 'Токенатор', url: TOKENATOR_URL, external: true },
      {
        label: 'Токенатор (старая версия)',
        url: TOKENATOR_LEGACY_URL,
        external: false,
      },
    ]);
  });
});
