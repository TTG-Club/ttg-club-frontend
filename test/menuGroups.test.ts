import { describe, expect, it } from 'vitest';

import {
  buildMenuGroups,
  getMenuLinkIcon,
  MENU_DEFAULT_ICON,
  TOKENATOR_LEGACY_URL,
  TOKENATOR_URL,
  VTTG_MENU_GROUP,
} from '~infrastructure/sidebar/menu/model';

describe('getMenuLinkIcon', () => {
  it('подбирает иконку пункта по адресу', () => {
    expect(getMenuLinkIcon('/classes')).toBe('tabler:sword');
  });

  it('ставит общую иконку пункту без своей', () => {
    expect(getMenuLinkIcon('/draft')).toBe(MENU_DEFAULT_ICON);
    expect(getMenuLinkIcon(undefined)).toBe(MENU_DEFAULT_ICON);
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
  });

  it('отмечает группу инструментов', () => {
    expect(
      buildMenuGroups(items, false).map((group) => !!group.isTools),
    ).toEqual([false, true, false]);
  });

  it('прячет пункты только для разработки вне dev', () => {
    expect(buildMenuGroups(items, false)[0]?.links).toEqual([
      {
        label: 'Классы',
        url: '/classes',
        icon: 'tabler:sword',
        external: false,
      },
    ]);

    expect(buildMenuGroups(items, true)).toHaveLength(4);
  });

  it('ведёт токенатор на новый сайт и оставляет старую версию рядом', () => {
    expect(buildMenuGroups(items, false)[1]?.links).toEqual([
      {
        label: 'Таверна',
        url: '/tools/tavern',
        icon: 'tabler:beer',
        external: false,
      },
      {
        label: 'Токенатор',
        url: TOKENATOR_URL,
        icon: 'tabler:photo-circle',
        external: true,
      },
      {
        label: 'Токенатор (старая версия)',
        url: TOKENATOR_LEGACY_URL,
        icon: 'tabler:photo',
        external: false,
      },
    ]);
  });
});
