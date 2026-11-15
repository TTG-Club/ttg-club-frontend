import type { MenuSection, SocialLink, SupportLink } from './types';

import {
  DM_SCREEN_PAGE_PATH,
  DM_SCREEN_PAGE_TITLE,
  NEW_SITE_URL,
} from '~/shared/consts';

/** Иконка для адреса, которого в меню нет. */
export const MENU_DEFAULT_ICON = 'tabler:point';

/** Иконка ширмы Мастера в меню и на самой ширме. */
export const DM_SCREEN_MENU_ICON = 'tabler:layout-dashboard';

/** Токенатор переехал на новый сайт. */
export const TOKENATOR_URL = `${NEW_SITE_URL}/tokenator`;

/**
 * Меню сайта: разделы и пункты в том порядке, в каком они показаны. Пункты с
 * `onHome` стоят и на главной, в том же порядке.
 */
export const MENU_SECTIONS: Array<MenuSection> = [
  {
    label: 'Персонаж',
    items: [
      {
        href: '/classes',
        label: 'Классы',
        icon: 'tabler:sword',
        onHome: true,
      },
      {
        href: '/races',
        label: 'Расы и происхождения',
        icon: 'tabler:users',
        onHome: true,
      },
      {
        href: '/feats',
        label: 'Черты',
        icon: 'tabler:star',
        onHome: true,
      },
      {
        href: '/options',
        label: 'Особенности классов',
        icon: 'tabler:list-details',
        onHome: true,
      },
      {
        href: '/backgrounds',
        label: 'Предыстории',
        icon: 'tabler:writing',
        onHome: true,
      },
      {
        href: '/spells',
        label: 'Заклинания',
        icon: 'tabler:sparkles',
        onHome: true,
      },
    ],
  },
  {
    label: 'Предметы',
    items: [
      {
        href: '/weapons',
        label: 'Оружие',
        icon: 'tabler:axe',
        onHome: true,
      },
      {
        href: '/armors',
        label: 'Доспехи',
        icon: 'tabler:shield',
        onHome: true,
      },
      {
        href: '/items',
        label: 'Снаряжение',
        icon: 'tabler:backpack',
        onHome: true,
      },
      {
        href: '/treasures',
        label: 'Драгоценности',
        icon: 'tabler:diamond',
      },
      {
        href: '/items/magic',
        label: 'Магические предметы',
        icon: 'tabler:wand',
        onHome: true,
      },
    ],
  },
  {
    label: 'Мастерская',
    items: [
      {
        href: '/bestiary',
        label: 'Бестиарий',
        icon: 'tabler:paw',
        onHome: true,
      },
      {
        href: '/screens',
        label: 'Справочник',
        icon: 'tabler:layout-board-split',
        onHome: true,
      },
    ],
  },
  {
    label: 'Инструменты',
    isTools: true,
    items: [
      {
        href: '/tools/ability-calc',
        label: 'Калькулятор характеристик',
        icon: 'tabler:calculator',
        onHome: true,
      },
      {
        href: '/tools/trader',
        label: 'Торговец',
        icon: 'tabler:building-store',
        onHome: true,
      },
      {
        href: '/tools/encounters',
        label: 'Случайные столкновения',
        icon: 'tabler:skull',
        onHome: true,
      },
      {
        href: '/tools/treasury',
        label: 'Сокровищница',
        icon: 'tabler:coins',
        onHome: true,
      },
      {
        href: '/tools/wildmagic',
        label: 'Дикая магия',
        icon: 'tabler:flame',
        onHome: true,
      },
      {
        href: '/tools/madness',
        label: 'Безумие',
        icon: 'tabler:brain',
        onHome: true,
      },
      {
        href: TOKENATOR_URL,
        label: 'Токенатор',
        icon: 'tabler:photo-circle',
        external: true,
        onHome: true,
      },
      {
        href: '/tools/tokenator',
        label: 'Токенатор (старая версия)',
        icon: 'tabler:photo',
      },
      {
        href: '/tools/names',
        label: 'Генератор имен',
        icon: 'tabler:signature',
        onHome: true,
      },
      {
        href: '/tools/tavern',
        label: 'Генератор таверны',
        icon: 'tabler:beer',
        onHome: true,
      },
      {
        href: '/tools/initiative',
        label: 'Трекер инициативы',
        icon: 'tabler:swords',
        onHome: true,
      },
      {
        href: DM_SCREEN_PAGE_PATH,
        label: DM_SCREEN_PAGE_TITLE,
        icon: DM_SCREEN_MENU_ICON,
        onHome: true,
      },
    ],
  },
  {
    label: 'База знаний',
    items: [
      {
        href: '/gods',
        label: 'Боги',
        icon: 'tabler:building-church',
      },
      {
        href: '/rules',
        label: 'Правила и термины',
        icon: 'tabler:book-2',
      },
      {
        href: '/books',
        label: 'Источники',
        icon: 'tabler:books',
      },
    ],
  },
  {
    label: 'Инструкции',
    items: [
      {
        href: '/info/exporting',
        label: 'Экспортирование',
        icon: 'tabler:file-export',
      },
      {
        href: '/info/bookmarks',
        label: 'Управление закладками',
        icon: 'tabler:bookmarks',
      },
    ],
  },
  {
    label: 'Virtual TTG',
    items: [
      {
        href: `${NEW_SITE_URL}/vttg`,
        label: 'Информация',
        icon: 'tabler:info-circle',
        external: true,
      },
      {
        href: `${NEW_SITE_URL}/vttg/reset-password`,
        label: 'Сброс мастер-пароля',
        icon: 'tabler:key',
        external: true,
      },
    ],
  },
];

/** Соцсети в подвале меню. */
export const MENU_CONTACT_LINKS: Array<SocialLink> = [
  { label: 'Telegram', url: 'https://t.me/ttgclubnews', icon: 'ttg:telegram' },
  { label: 'VK', url: 'https://vk.com/ttg.club', icon: 'ttg:vk' },
  {
    label: 'Discord',
    url: 'https://discord.gg/JqFKMKRtxv',
    icon: 'ttg:discord',
  },
  {
    label: 'YouTube',
    url: 'https://www.youtube.com/channel/UCpFse6-P2IBXYfkesAxZbfA',
    icon: 'ttg:youtube',
  },
];

/** Ссылки на поддержку проекта в подвале меню. */
export const MENU_SUPPORT_LINKS: Array<SupportLink> = [
  {
    label: 'Boosty TTG Club',
    title: 'TTG Club',
    url: 'https://boosty.to/dnd5club',
    icon: 'ttg:boosty',
  },
  {
    label: 'Boosty Magistrus',
    title: 'Magistrus',
    url: 'https://boosty.to/dnd5eclub',
    icon: 'ttg:boosty',
  },
];
