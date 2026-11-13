import type { HomeGame } from '~home/model';

import { describe, expect, it } from 'vitest';

import {
  findLatestGame,
  getHomeGameFormatSummary,
  getHomeGameGenresLabel,
  getHomeSections,
  getHomeSiteImageUrl,
  getHomeTools,
  HOME_SECTION_DEFAULT_ICON,
  parseHomePartners,
} from '~home/model';
import {
  getMenuLinkIcon,
  MENU_DEFAULT_ICON,
  MENU_SECTIONS,
  TOKENATOR_URL,
} from '~infrastructure/navigation/model';

const menu = [
  {
    label: 'Персонаж',
    items: [
      { label: 'Классы', href: '/classes', icon: 'tabler:sword', onHome: true },
      { label: 'Новое', href: '/new', icon: 'tabler:point', onHome: true },
      { label: 'Скрытое', href: '/hidden', icon: 'tabler:point' },
    ],
  },
  {
    label: 'Инструменты',
    isTools: true,
    items: [
      {
        label: 'Токенатор',
        href: TOKENATOR_URL,
        icon: 'tabler:photo-circle',
        external: true,
        onHome: true,
      },
      {
        label: 'Токенатор (старая версия)',
        href: '/tools/tokenator',
        icon: 'tabler:photo',
      },
      {
        label: 'Таверна',
        href: '/tools/tavern',
        icon: 'tabler:beer',
        onHome: true,
      },
    ],
  },
];

describe('меню сайта', () => {
  it('адреса пунктов не повторяются', () => {
    const hrefs = MENU_SECTIONS.flatMap((section) =>
      section.items.map((menuItem) => menuItem.href),
    );

    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('отдаёт иконку раздела по адресу, незнакомому адресу — общую', () => {
    expect(getMenuLinkIcon('/classes')).toBe('tabler:sword');
    expect(getMenuLinkIcon('/draft')).toBe(MENU_DEFAULT_ICON);
  });
});

describe('getHomeSections', () => {
  it('берёт отмеченные для главной пункты в порядке меню, без инструментов', () => {
    const sections = getHomeSections(menu);

    expect(sections.map((section) => section.url)).toEqual([
      '/classes',
      '/new',
    ]);

    expect(sections[0]).toMatchObject({
      icon: 'tabler:sword',
      external: false,
    });

    expect(sections[0]?.textureStyle).toMatchObject({
      backgroundPositionY: '0%',
    });
  });

  it('незнакомый раздел получает общую иконку', () => {
    expect(getHomeSections(menu).at(-1)).toMatchObject({
      url: '/new',
      icon: HOME_SECTION_DEFAULT_ICON,
    });
  });
});

describe('getHomeTools', () => {
  it('берёт отмеченные инструменты в порядке меню, без старого токенатора', () => {
    expect(getHomeTools(menu)).toEqual([
      {
        name: 'Токенатор',
        url: TOKENATOR_URL,
        icon: 'tabler:photo-circle',
        external: true,
      },
      {
        name: 'Таверна',
        url: '/tools/tavern',
        icon: 'tabler:beer',
        external: false,
      },
    ]);
  });
});

const game: HomeGame = {
  id: '6f1c2b8e-1d2a-4c3b-9a8e-0f1e2d3c4b5a',
  masterId: 'master',
  title: 'Подземелье',
  system: 'DND5E',
  type: 'OFFLINE',
  city: 'Москва',
  durationType: 'ONE_SHOT',
  costType: 'FREE',
  maxPlayers: 5,
  takenSeats: 2,
  genres: ['Хоррор'],
  customGenre: 'Детектив',
  createdAt: '2026-10-01T10:00:00Z',
};

describe('игра на главной', () => {
  it('собирает строку формата и жанров', () => {
    expect(getHomeGameFormatSummary(game)).toBe('Вживую, Москва · Ваншот');
    expect(getHomeGameGenresLabel(game)).toBe('Хоррор, Детектив');
  });

  it('выбирает самую свежую игру по дате создания', () => {
    const newer = { ...game, id: 'newer', createdAt: '2026-10-05T10:00:00Z' };

    expect(findLatestGame([game, newer])?.id).toBe('newer');
    expect(findLatestGame([])).toBeUndefined();
  });

  it('достраивает адрес картинки с new.ttg.club и отбрасывает мусор', () => {
    expect(getHomeSiteImageUrl('/s3/a.webp')).toBe(
      'https://new.ttg.club/s3/a.webp',
    );

    expect(getHomeSiteImageUrl('https://x.ru/a.webp')).toBe(
      'https://x.ru/a.webp',
    );

    expect(getHomeSiteImageUrl('javascript:alert(1)')).toBeUndefined();
    expect(getHomeSiteImageUrl(null)).toBeUndefined();
  });
});

describe('разбор ответов', () => {
  it('отсеивает битых друзей поштучно', () => {
    expect(
      parseHomePartners([
        { name: 'Друг', img: '/a.png', url: 'https://a.ru' },
        { name: '', img: '/b.png', url: 'https://b.ru' },
      ]),
    ).toEqual([
      {
        name: 'Друг',
        description: undefined,
        img: '/a.png',
        url: 'https://a.ru',
        order: 0,
      },
    ]);
  });
});
