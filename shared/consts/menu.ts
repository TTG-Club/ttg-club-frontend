import type { SiteMenuItem } from '../types';

/** Путь меню сайта в API. */
export const MENU_PATH = '/api/v1/menu';

/**
 * Запасная копия меню (снимок `GET /api/v1/menu` на 2026-11-10). Её отдаёт
 * сервер, пока API не ответил ни разу, и с неё же стартует меню в браузере —
 * поэтому меню не пропадает, даже если база недоступна.
 */
export const MENU_FALLBACK: Array<SiteMenuItem> = [
  {
    name: 'Персонаж',
    icon: 'menu/filled/character',
    order: 1,
    children: [
      {
        name: 'Классы',
        url: '/classes',
        order: 1,
        onIndex: true,
        indexOrder: 1,
      },
      {
        name: 'Расы и происхождения',
        url: '/races',
        order: 2,
        onIndex: true,
        indexOrder: 2,
      },
      {
        name: 'Черты',
        url: '/feats',
        order: 3,
        onIndex: true,
        indexOrder: 3,
      },
      {
        name: 'Особенности классов',
        url: '/options',
        order: 4,
        onIndex: true,
        indexOrder: 4,
      },
      {
        name: 'Предыстории',
        url: '/backgrounds',
        order: 5,
        onIndex: true,
        indexOrder: 5,
      },
      {
        name: 'Заклинания',
        url: '/spells',
        order: 6,
        onIndex: true,
        indexOrder: 6,
      },
    ],
  },
  {
    name: 'Предметы',
    icon: 'menu/filled/inventory',
    order: 2,
    children: [
      {
        name: 'Оружие',
        url: '/weapons',
        order: 1,
        onIndex: true,
        indexOrder: 7,
      },
      {
        name: 'Доспехи',
        url: '/armors',
        order: 2,
        onIndex: true,
        indexOrder: 8,
      },
      {
        name: 'Снаряжение',
        url: '/items',
        order: 3,
        onIndex: true,
        indexOrder: 9,
      },
      {
        name: 'Драгоценности',
        url: '/treasures',
        order: 4,
      },
      {
        name: 'Магические предметы',
        url: '/items/magic',
        order: 5,
        onIndex: true,
        indexOrder: 10,
      },
    ],
  },
  {
    name: 'Мастерская',
    icon: 'menu/filled/workshop',
    order: 3,
    children: [
      {
        name: 'Бестиарий',
        url: '/bestiary',
        order: 1,
        onIndex: true,
        indexOrder: 11,
      },
      {
        name: 'Ширма (Справочник)',
        url: '/screens',
        order: 2,
        onIndex: true,
        indexOrder: 12,
      },
    ],
  },
  {
    name: 'Инструменты',
    icon: 'menu/filled/tools',
    order: 4,
    children: [
      {
        name: 'Калькулятор характеристик',
        url: '/tools/ability-calc',
        order: 1,
      },
      {
        name: 'Торговец',
        url: '/tools/trader',
        order: 2,
      },
      {
        name: 'Случайные столкновения',
        url: '/tools/encounters',
        order: 3,
      },
      {
        name: 'Сокровищница',
        url: '/tools/treasury',
        order: 4,
      },
      {
        name: 'Дикая магия',
        url: '/tools/wildmagic',
        order: 5,
      },
      {
        name: 'Безумие',
        url: '/tools/madness',
        order: 6,
      },
      {
        name: 'Токенатор',
        url: '/tools/tokenator',
        order: 7,
        indexOrder: 7,
      },
      {
        name: 'Генератор имен',
        url: '/tools/names',
        order: 8,
      },
      {
        name: 'Генератор таверны',
        url: '/tools/tavern',
        order: 9,
      },
      {
        name: 'Трекер инициативы',
        url: '/tools/initiative',
        order: 10,
      },
    ],
  },
  {
    name: 'База знаний',
    icon: 'menu/filled/wiki',
    order: 5,
    children: [
      {
        name: 'Боги',
        url: '/gods',
        order: 1,
      },
      {
        name: 'Правила и термины',
        url: '/rules',
        order: 2,
      },
      {
        name: 'Источники',
        url: '/books',
        order: 3,
      },
    ],
  },
  {
    name: 'Инструкции',
    icon: 'menu/filled/question',
    order: 6,
    children: [
      {
        name: 'Экспортирование',
        url: '/info/exporting',
        order: 3,
      },
      {
        name: 'Управление закладками',
        url: '/info/bookmarks',
        order: 4,
      },
    ],
  },
];

/**
 * Пункты, которые не показываются в меню, даже если их вернул API. Меню
 * хранится в базе, и без этого списка выключенный пункт вернулся бы при
 * восстановлении базы из дампа.
 *
 * `/info/discord_bot` — бот сейчас не работает: с сервера в России Discord
 * недоступен. Вернуть пункт — убрать адрес отсюда (и из базы ничего удалять
 * не нужно).
 */
export const MENU_HIDDEN_URLS: ReadonlySet<string> = new Set([
  '/info/discord_bot',
]);
