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
  parseHomeVideos,
} from '~home/model';
import { TOKENATOR_URL } from '~infrastructure/sidebar/menu/model';

const menu = [
  {
    name: 'Персонаж',
    order: 1,
    children: [
      { name: 'Расы', url: '/races', order: 2, onIndex: true, indexOrder: 2 },
      {
        name: 'Классы',
        url: '/classes',
        order: 1,
        onIndex: true,
        indexOrder: 1,
      },
      {
        name: 'Новое',
        url: '/new',
        order: 3,
        onIndex: true,
        indexOrder: 3,
        onlyDev: true,
      },
      { name: 'Скрытое', url: '/hidden', order: 4 },
    ],
  },
  {
    name: 'Инструменты',
    order: 2,
    children: [
      { name: 'Таверна', url: '/tools/tavern', order: 2 },
      { name: 'Токенатор', url: '/tools/tokenator', order: 1 },
      { name: 'Магазин', url: '/tools/trader', order: 3, onlyDev: true },
    ],
  },
];

describe('getHomeSections', () => {
  it('берёт пункты для главной в порядке indexOrder и прячет пункты разработки', () => {
    const sections = getHomeSections(menu, false);

    expect(sections.map((section) => section.url)).toEqual([
      '/classes',
      '/races',
    ]);

    expect(sections[0]).toMatchObject({
      icon: 'tabler:sword',
      external: false,
    });

    expect(sections[0]?.textureStyle).toMatchObject({
      backgroundPositionY: '0%',
    });
  });

  it('в режиме разработки показывает всё, незнакомый раздел получает общую иконку', () => {
    const sections = getHomeSections(menu, true);

    expect(sections.at(-1)).toMatchObject({
      url: '/new',
      icon: HOME_SECTION_DEFAULT_ICON,
    });
  });
});

describe('getHomeTools', () => {
  it('ведёт токенатор на новый сайт и сортирует по порядку меню', () => {
    expect(getHomeTools(menu, false)).toEqual([
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

  it('берёт ролики из страницы ответа', () => {
    expect(
      parseHomeVideos({
        items: [{ id: 'abc', name: 'Ролик' }, { name: 'без id' }],
      }),
    ).toEqual([{ id: 'abc', name: 'Ролик' }]);

    expect(parseHomeVideos(null)).toEqual([]);
  });
});
